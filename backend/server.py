from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import random
import string
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'vitamed_secret_key_2025')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class UserRegister(BaseModel):
    phone: str
    password: str
    name: str

class UserLogin(BaseModel):
    phone: str
    password: str

class UserResponse(BaseModel):
    id: str
    phone: str
    name: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse

class VerificationRequest(BaseModel):
    phone: str

class VerificationVerify(BaseModel):
    phone: str
    code: str

class DocumentCreate(BaseModel):
    title: str
    type: str  # "blood_test", "xray", "prescription", "other"
    date: datetime
    notes: Optional[str] = None
    file_data: str  # base64 encoded
    file_type: str  # "pdf", "image"

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    type: str
    date: datetime
    notes: Optional[str]
    file_data: str
    file_type: str
    created_at: datetime

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    id: str
    user_message: str
    assistant_message: str
    created_at: datetime

# Store verification codes (in production, use Redis or similar)
verification_codes = {}

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow().timestamp() + 86400 * 30  # 30 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload.get('user_id')
    except:
        return None

# Auth Routes
@api_router.post("/auth/send-code")
async def send_verification_code(request: VerificationRequest):
    """Send verification code to phone (simulated)"""
    code = generate_verification_code()
    verification_codes[request.phone] = {
        'code': code,
        'expires': datetime.utcnow().timestamp() + 300  # 5 minutes
    }
    # In production, send SMS here
    # For demo, we'll return the code (remove in production)
    return {"message": "Doğrulama kodu gönderildi", "demo_code": code}

@api_router.post("/auth/verify-code")
async def verify_code(request: VerificationVerify):
    """Verify the code sent to phone"""
    stored = verification_codes.get(request.phone)
    if not stored:
        raise HTTPException(status_code=400, detail="Doğrulama kodu bulunamadı")
    
    if datetime.utcnow().timestamp() > stored['expires']:
        del verification_codes[request.phone]
        raise HTTPException(status_code=400, detail="Doğrulama kodu süresi doldu")
    
    if stored['code'] != request.code:
        raise HTTPException(status_code=400, detail="Geçersiz doğrulama kodu")
    
    # Mark as verified
    verification_codes[request.phone]['verified'] = True
    return {"message": "Telefon doğrulandı", "verified": True}

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(request: UserRegister):
    """Register a new user"""
    # Check if phone is verified
    stored = verification_codes.get(request.phone)
    if not stored or not stored.get('verified'):
        raise HTTPException(status_code=400, detail="Lütfen önce telefonunuzu doğrulayın")
    
    # Check if user exists
    existing = await db.users.find_one({"phone": request.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Bu telefon numarası zaten kayıtlı")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "phone": request.phone,
        "password": hash_password(request.password),
        "name": request.name,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_doc)
    
    # Clean up verification
    del verification_codes[request.phone]
    
    # Create token
    token = create_token(user_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            phone=request.phone,
            name=request.name,
            created_at=user_doc['created_at']
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: UserLogin):
    """Login user"""
    user = await db.users.find_one({"phone": request.phone})
    if not user:
        raise HTTPException(status_code=401, detail="Telefon numarası veya şifre hatalı")
    
    if not verify_password(request.password, user['password']):
        raise HTTPException(status_code=401, detail="Telefon numarası veya şifre hatalı")
    
    token = create_token(user['_id'])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user['_id'],
            phone=user['phone'],
            name=user['name'],
            created_at=user['created_at']
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user(token: str):
    """Get current user from token"""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    return UserResponse(
        id=user['_id'],
        phone=user['phone'],
        name=user['name'],
        created_at=user['created_at']
    )

# Document Routes
@api_router.post("/documents", response_model=DocumentResponse)
async def create_document(document: DocumentCreate, token: str):
    """Create a new health document"""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    doc_id = str(uuid.uuid4())
    doc = {
        "_id": doc_id,
        "user_id": user_id,
        "title": document.title,
        "type": document.type,
        "date": document.date,
        "notes": document.notes,
        "file_data": document.file_data,
        "file_type": document.file_type,
        "created_at": datetime.utcnow()
    }
    await db.documents.insert_one(doc)
    
    return DocumentResponse(
        id=doc_id,
        user_id=user_id,
        title=document.title,
        type=document.type,
        date=document.date,
        notes=document.notes,
        file_data=document.file_data,
        file_type=document.file_type,
        created_at=doc['created_at']
    )

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(token: str):
    """Get all documents for the current user"""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    docs = await db.documents.find({"user_id": user_id}).sort("date", -1).to_list(100)
    
    return [
        DocumentResponse(
            id=doc['_id'],
            user_id=doc['user_id'],
            title=doc['title'],
            type=doc['type'],
            date=doc['date'],
            notes=doc.get('notes'),
            file_data=doc['file_data'],
            file_type=doc['file_type'],
            created_at=doc['created_at']
        )
        for doc in docs
    ]

@api_router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, token: str):
    """Get a specific document"""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    doc = await db.documents.find_one({"_id": doc_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    return DocumentResponse(
        id=doc['_id'],
        user_id=doc['user_id'],
        title=doc['title'],
        type=doc['type'],
        date=doc['date'],
        notes=doc.get('notes'),
        file_data=doc['file_data'],
        file_type=doc['file_type'],
        created_at=doc['created_at']
    )

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, token: str):
    """Delete a document"""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    result = await db.documents.delete_one({"_id": doc_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Belge bulunamadı")
    
    return {"message": "Belge silindi"}

# Chat Routes
@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(message: ChatMessage, token: str):
    """Chat with health assistant"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    system_message = """Sen VitaMed uygulamasının sağlık asistanısın. Türkçe konuşuyorsun.

Görevin:
- Kullanıcılara genel sağlık bilgileri vermek
- Sağlıklı yaşam önerileri sunmak
- Tıbbi terimleri açıklamak
- Laboratuvar sonuçlarını genel olarak yorumlamak

ÖNEMLİ KURALLAR:
1. ASLA tanı koyma veya tedavi önerme
2. Her zaman "Bu bilgiler genel bilgilendirme amaçlıdır, kesin tanı ve tedavi için mutlaka bir doktora başvurunuz" uyarısı yap
3. Acil durumları tanımla ve hemen tıbbi yardım almalarını söyle
4. Nazik, anlayışlı ve profesyonel ol
5. Yanıtlarını kısa ve öz tut"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"vitamed_{user_id}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        user_msg = UserMessage(text=message.message)
        response = await chat.send_message(user_msg)
        
        # Save to database
        chat_id = str(uuid.uuid4())
        chat_doc = {
            "_id": chat_id,
            "user_id": user_id,
            "user_message": message.message,
            "assistant_message": response,
            "created_at": datetime.utcnow()
        }
        await db.chats.insert_one(chat_doc)
        
        return ChatResponse(
            id=chat_id,
            user_message=message.message,
            assistant_message=response,
            created_at=chat_doc['created_at']
        )
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Asistan yanıt veremedi: {str(e)}")

@api_router.get("/chat/history", response_model=List[ChatResponse])
async def get_chat_history(token: str):
    """Get chat history for the current user"""
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş token")
    
    chats = await db.chats.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    
    return [
        ChatResponse(
            id=chat['_id'],
            user_message=chat['user_message'],
            assistant_message=chat['assistant_message'],
            created_at=chat['created_at']
        )
        for chat in chats
    ]

# Health Check
@api_router.get("/")
async def root():
    return {"message": "VitaMed API çalışıyor", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "VitaMed API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
