import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  phone: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationCode: (phone: string) => Promise<string>;
  verifyCode: (phone: string, code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('vitamed_token');
      if (storedToken) {
        const response = await api.get(`/auth/me?token=${storedToken}`);
        setUser(response.data);
        setToken(storedToken);
      }
    } catch (error) {
      console.log('No stored auth or invalid token');
      await AsyncStorage.removeItem('vitamed_token');
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (phone: string): Promise<string> => {
    const response = await api.post('/auth/send-code', { phone });
    return response.data.demo_code; // Only for demo
  };

  const verifyCode = async (phone: string, code: string): Promise<boolean> => {
    const response = await api.post('/auth/verify-code', { phone, code });
    return response.data.verified;
  };

  const login = async (phone: string, password: string) => {
    const response = await api.post('/auth/login', { phone, password });
    const { access_token, user: userData } = response.data;
    await AsyncStorage.setItem('vitamed_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const register = async (phone: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { phone, password, name });
    const { access_token, user: userData } = response.data;
    await AsyncStorage.setItem('vitamed_token', access_token);
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('vitamed_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        sendVerificationCode,
        verifyCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
