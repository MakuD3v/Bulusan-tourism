import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../data/types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: AppUser | null;
  role: 'USER' | 'ADMIN' | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<AppUser>) => Promise<void>;
  loading: boolean;
  isDemoMode: boolean; // Retained for compatibility if needed elsewhere
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
        } catch {
          setUser(null);
          localStorage.removeItem('bulusan_user');
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error', error);
      throw new Error(error.message || 'Invalid credentials');
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/google', { credential });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Google login error', error);
      throw new Error(error.message || 'Google Login failed');
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post('/auth/register', { name, email, password });
      if (res.token) {
        localStorage.setItem('auth_token', res.token);
        localStorage.setItem('bulusan_user', JSON.stringify(res.user));
        setUser(res.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Signup error', error);
      throw new Error(error.message || 'Error signing up');
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
    <AuthContext.Provider value={{ user, role: user?.role || null, login, loginWithGoogle, signup, logout, updateUser, loading, isDemoMode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
