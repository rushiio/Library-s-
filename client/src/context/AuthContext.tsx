import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, Role } from '../types';

export type AuthModalView = 'login' | 'signup' | 'forgot' | 'reset' | 'force_change';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  contextMessage: string | null;
  openAuthModal: (view?: AuthModalView, message?: string, onComplete?: () => void) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  signup: (formData: any) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (newPassword: string, confirmPassword: string, currentPassword?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('libra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('libra_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  const openAuthModal = (view: AuthModalView = 'login', message?: string, onComplete?: () => void) => {
    setAuthModalView(view);
    setContextMessage(message || null);
    setOnSuccessCallback(onComplete ? () => onComplete : null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setContextMessage(null);
    setOnSuccessCallback(null);
  };

  const refreshProfile = async () => {
    if (!localStorage.getItem('libra_token')) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('libra_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // If token expired/invalid, clean up
      localStorage.removeItem('libra_token');
      localStorage.removeItem('libra_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, rememberMe });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('libra_token', receivedToken);
        localStorage.setItem('libra_user', JSON.stringify(receivedUser));

        if (receivedUser.mustChangePassword) {
          setAuthModalView('force_change');
          setIsAuthModalOpen(true);
        } else {
          const callback = onSuccessCallback;
          closeAuthModal();
          if (callback) callback();
        }
        return receivedUser;
      } else {
        throw new Error(res.data.error || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (formData: any) => {
    const res = await api.post('/auth/signup', formData);
    return res.data;
  };

  const forgotPassword = async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (resetToken: string, newPassword: string, confirmPassword: string) => {
    const res = await api.post('/auth/reset-password', { token: resetToken, newPassword, confirmPassword });
    return res.data;
  };

  const changePassword = async (newPassword: string, confirmPassword: string, currentPassword?: string) => {
    const res = await api.post('/auth/change-password', { newPassword, confirmPassword, currentPassword });
    if (res.data.success && user) {
      const updatedUser = { ...user, mustChangePassword: false };
      setUser(updatedUser);
      localStorage.setItem('libra_user', JSON.stringify(updatedUser));
      closeAuthModal();
    }
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('libra_token');
    localStorage.removeItem('libra_user');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isAuthModalOpen,
        authModalView,
        contextMessage,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        forgotPassword,
        resetPassword,
        changePassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
