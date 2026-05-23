import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../data/types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: AppUser | null;
  role: 'USER' | 'ADMIN' | 'OWNER' | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresVerification?: boolean }>;
  signup: (name: string, email: string, password: string, additionalDetails?: any) => Promise<{ success: boolean; requiresVerification?: boolean }>;
  verifyCode: (email: string, code: string) => Promise<{ success: boolean }>;
  logout: () => void;
  updateUser: (data: Partial<AppUser>) => Promise<void>;
  loading: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = false;

  useEffect(() => {
    const loadUser = async () => {
      const stored = localStorage.getItem('bulusan_user');
      const token = localStorage.getItem('auth_token');
      if (stored && token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.user);
          localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        } catch (err: any) {
          console.error('Session verification failed:', err);
          const isAuthError = err.message?.includes('401') || err.message?.includes('403');
          if (isAuthError) {
            setUser(null);
            localStorage.removeItem('bulusan_user');
            localStorage.removeItem('auth_token');
          } else if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              setUser(null);
            }
          }
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      console.error('Login error', error);
      throw new Error(error.message || 'Invalid credentials');
    }
  };

  const signup = async (name: string, email: string, password: string, additionalDetails?: any) => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, ...additionalDetails });
      
      if (res.requiresVerification) {
        return { success: true, requiresVerification: true };
      }
      
      // Admin creation
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return { success: true, requiresVerification: false };
      }
      return { success: false };
    } catch (error: any) {
      console.error('Signup error', error);
      throw new Error(error.message || 'Error signing up');
    }
  };

  const verifyCode = async (email: string, code: string) => {
    try {
      const res = await apiClient.post('/auth/verify-code', { email, code });
      if (res.token && res.user) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      console.error('Verify code error', error);
      throw new Error(error.message || 'Invalid or expired code');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bulusan_user');
    setUser(null);
  };

  const updateUser = async (data: Partial<AppUser>) => {
    if (!user) return;
    try {
      const updated = await apiClient.put(`/users/${user.id}`, data);
      setUser(updated);
      localStorage.setItem('bulusan_user', JSON.stringify(updated));
    } catch (e) {
      console.error('Update user error', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login, signup, verifyCode, logout, updateUser, loading, isDemoMode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
