#!/usr/bin/env python3
"""
VitaMed Backend API Test Suite
Tests all backend endpoints according to the test_result.md requirements
"""

import requests
import json
import base64
from datetime import datetime
import uuid
import time

# Backend URL from frontend .env
BACKEND_URL = "https://saglikcebimde.preview.emergentagent.com/api"

class VitaMedAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.user_id = None
        self.test_phone = "+905551234567"
        self.test_password = "TestSifre123!"
        self.test_name = "Ahmet Yılmaz"
        self.verification_code = None
        self.document_id = None
        
    def log_test(self, test_name, success, details=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False
    
    def test_send_verification_code(self):
        """Test POST /auth/send-code"""
        try:
            payload = {"phone": self.test_phone}
            response = requests.post(f"{self.base_url}/auth/send-code", 
                                   json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.verification_code = data.get("demo_code")
                success = "demo_code" in data
                details = f"Status: {response.status_code}, Code: {self.verification_code}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Send Verification Code", success, details)
            return success
        except Exception as e:
            self.log_test("Send Verification Code", False, f"Error: {str(e)}")
            return False
    
    def test_verify_code(self):
        """Test POST /auth/verify-code"""
        if not self.verification_code:
            self.log_test("Verify Code", False, "No verification code available")
            return False
            
        try:
            payload = {
                "phone": self.test_phone,
                "code": self.verification_code
            }
            response = requests.post(f"{self.base_url}/auth/verify-code", 
                                   json=payload, timeout=10)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Verified: {data.get('verified')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Verify Code", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Code", False, f"Error: {str(e)}")
            return False
    
    def test_register_user(self):
        """Test POST /auth/register"""
        try:
            payload = {
                "phone": self.test_phone,
                "password": self.test_password,
                "name": self.test_name
            }
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                success = bool(self.token and self.user_id)
                details = f"Status: {response.status_code}, Token: {'Yes' if self.token else 'No'}, User ID: {self.user_id}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Register User", success, details)
            return success
        except Exception as e:
            self.log_test("Register User", False, f"Error: {str(e)}")
            return False
    
    def test_login_user(self):
        """Test POST /auth/login"""
        try:
            payload = {
                "phone": self.test_phone,
                "password": self.test_password
            }
            response = requests.post(f"{self.base_url}/auth/login", 
                                   json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                login_token = data.get("access_token")
                login_user_id = data.get("user", {}).get("id")
                success = bool(login_token and login_user_id)
                details = f"Status: {response.status_code}, Token: {'Yes' if login_token else 'No'}, User ID: {login_user_id}"
                
                # Update token for subsequent tests
                if success:
                    self.token = login_token
                    self.user_id = login_user_id
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Login User", success, details)
            return success
        except Exception as e:
            self.log_test("Login User", False, f"Error: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test GET /auth/me"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        try:
            params = {"token": self.token}
            response = requests.get(f"{self.base_url}/auth/me", 
                                  params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("id") == self.user_id
                details = f"Status: {response.status_code}, User ID matches: {success}, Name: {data.get('name')}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Current User", success, details)
            return success
        except Exception as e:
            self.log_test("Get Current User", False, f"Error: {str(e)}")
            return False
    
    def test_create_document(self):
        """Test POST /documents"""
        if not self.token:
            self.log_test("Create Document", False, "No token available")
            return False
            
        try:
            # Create a simple base64 encoded test file
            test_content = "Bu bir test belgesidir. VitaMed sağlık uygulaması için oluşturulmuştur."
            test_file_data = base64.b64encode(test_content.encode()).decode()
            
            payload = {
                "title": "Kan Tahlili Sonucu",
                "type": "blood_test",
                "date": datetime.now().isoformat(),
                "notes": "Rutin kan tahlili sonuçları",
                "file_data": test_file_data,
                "file_type": "pdf"
            }
            
            params = {"token": self.token}
            response = requests.post(f"{self.base_url}/documents", 
                                   json=payload, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.document_id = data.get("id")
                success = bool(self.document_id and data.get("title") == payload["title"])
                details = f"Status: {response.status_code}, Document ID: {self.document_id}, Title: {data.get('title')}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Create Document", success, details)
            return success
        except Exception as e:
            self.log_test("Create Document", False, f"Error: {str(e)}")
            return False
    
    def test_get_documents(self):
        """Test GET /documents"""
        if not self.token:
            self.log_test("Get Documents", False, "No token available")
            return False
            
        try:
            params = {"token": self.token}
            response = requests.get(f"{self.base_url}/documents", 
                                  params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = isinstance(data, list)
                if success and self.document_id:
                    # Check if our created document is in the list
                    doc_found = any(doc.get("id") == self.document_id for doc in data)
                    success = doc_found
                    details = f"Status: {response.status_code}, Documents count: {len(data)}, Created doc found: {doc_found}"
                else:
                    details = f"Status: {response.status_code}, Documents count: {len(data) if isinstance(data, list) else 'N/A'}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Documents", success, details)
            return success
        except Exception as e:
            self.log_test("Get Documents", False, f"Error: {str(e)}")
            return False
    
    def test_get_single_document(self):
        """Test GET /documents/{doc_id}"""
        if not self.token or not self.document_id:
            self.log_test("Get Single Document", False, "No token or document ID available")
            return False
            
        try:
            params = {"token": self.token}
            response = requests.get(f"{self.base_url}/documents/{self.document_id}", 
                                  params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("id") == self.document_id
                details = f"Status: {response.status_code}, Document ID matches: {success}, Title: {data.get('title')}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Single Document", success, details)
            return success
        except Exception as e:
            self.log_test("Get Single Document", False, f"Error: {str(e)}")
            return False
    
    def test_chat_with_assistant(self):
        """Test POST /chat (already working according to test_result.md)"""
        if not self.token:
            self.log_test("Chat with Assistant", False, "No token available")
            return False
            
        try:
            payload = {
                "message": "Merhaba, kan tahlili sonuçlarım hakkında genel bilgi alabilir miyim?"
            }
            
            params = {"token": self.token}
            response = requests.post(f"{self.base_url}/chat", 
                                   json=payload, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                success = bool(data.get("assistant_message"))
                details = f"Status: {response.status_code}, Response length: {len(data.get('assistant_message', ''))}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Chat with Assistant", success, details)
            return success
        except Exception as e:
            self.log_test("Chat with Assistant", False, f"Error: {str(e)}")
            return False
    
    def test_get_chat_history(self):
        """Test GET /chat/history"""
        if not self.token:
            self.log_test("Get Chat History", False, "No token available")
            return False
            
        try:
            params = {"token": self.token}
            response = requests.get(f"{self.base_url}/chat/history", 
                                  params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Chat history count: {len(data) if isinstance(data, list) else 'N/A'}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Get Chat History", success, details)
            return success
        except Exception as e:
            self.log_test("Get Chat History", False, f"Error: {str(e)}")
            return False
    
    def test_delete_document(self):
        """Test DELETE /documents/{doc_id}"""
        if not self.token or not self.document_id:
            self.log_test("Delete Document", False, "No token or document ID available")
            return False
            
        try:
            params = {"token": self.token}
            response = requests.delete(f"{self.base_url}/documents/{self.document_id}", 
                                     params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = "silindi" in data.get("message", "").lower()
                details = f"Status: {response.status_code}, Message: {data.get('message')}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text}"
                
            self.log_test("Delete Document", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Document", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests in sequence"""
        print("=" * 60)
        print("VitaMed Backend API Test Suite")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        results = {}
        
        # Basic connectivity
        results["health_check"] = self.test_health_check()
        
        # Auth flow tests
        results["send_code"] = self.test_send_verification_code()
        results["verify_code"] = self.test_verify_code()
        results["register"] = self.test_register_user()
        results["login"] = self.test_login_user()
        results["get_current_user"] = self.test_get_current_user()
        
        # Document CRUD tests
        results["create_document"] = self.test_create_document()
        results["get_documents"] = self.test_get_documents()
        results["get_single_document"] = self.test_get_single_document()
        
        # Chat tests
        results["chat_assistant"] = self.test_chat_with_assistant()
        results["chat_history"] = self.test_get_chat_history()
        
        # Cleanup - delete test document
        results["delete_document"] = self.test_delete_document()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for success in results.values() if success)
        total = len(results)
        
        for test_name, success in results.items():
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed - check details above")
        
        return results

if __name__ == "__main__":
    tester = VitaMedAPITester()
    results = tester.run_all_tests()