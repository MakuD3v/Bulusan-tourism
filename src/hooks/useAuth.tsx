import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../data/types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: AppUser | null;
  role: 'USER' | 'ADMIN' | 'OWNER' | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean }>;
  signup: (name: string, email: string, password: string, additionalDetails?: any) => Promise<{ success: boolean }>;
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
      const stored = localStorage.getItem('bulusan_user') || sessionStorage.getItem('bulusan_user');
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (stored && token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.user);
          const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
          storage.setItem('bulusan_user', JSON.stringify(res.user));
        } catch (err: any) {
          console.error('Session verification failed:', err);
          const msg = err.message?.toLowerCase() || '';
          const isAuthError = msg.includes('401') || msg.includes('403') || msg.includes('forbidden') || msg.includes('unauthorized') || msg.includes('invalid');
          if (isAuthError) {
            setUser(null);
            localStorage.removeItem('bulusan_user');
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('bulusan_user');
            sessionStorage.removeItem('auth_token');
          } else if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              setUser(null);
            }
          }
        }
      }

      // Check for background password recovery polling
      const pendingEmail = localStorage.getItem('pending_recovery_email');
      if (pendingEmail && !token) {
        try {
          const res = await apiClient.get(`/auth/recovery/status/${encodeURIComponent(pendingEmail)}`);
          if (res.status === 'APPROVED' && res.token) {
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('bulusan_user', JSON.stringify(res.user));
            setUser(res.user);
            localStorage.removeItem('pending_recovery_email');
          }
        } catch (e) {
          // Silent fail for polling
        }
      }

      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.token) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('auth_token', res.token);
        storage.setItem('bulusan_user', JSON.stringify(res.user));
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
      
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return { success: true };
      }
      return { success: false };
    } catch (error: any) {
      console.error('Signup error', error);
      throw new Error(error.message || 'Error signing up');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bulusan_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('bulusan_user');
    setUser(null);
  };

  const updateUser = async (data: Partial<AppUser>) => {
    if (!user) return;
    try {
      const updated = await apiClient.put(`/users/${user.id}`, data);
      setUser(updated);
      const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
      storage.setItem('bulusan_user', JSON.stringify(updated));
    } catch (e) {
      console.error('Update user error', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login, signup, logout, updateUser, loading, isDemoMode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
