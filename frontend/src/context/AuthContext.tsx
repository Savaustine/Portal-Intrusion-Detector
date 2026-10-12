import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api, LoginData, RegisterData, AuthResponse, UserProfile } from '../lib/api';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<UserProfile>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // JWT is held strictly in memory (React state)
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const login = async (data: LoginData): Promise<UserProfile> => {
    const res: AuthResponse = await api.login(data);
    setToken(res.access_token);
    const loggedInUser: UserProfile = res.user || {
      reg_number: data.reg_number || data.username || '',
      full_name: data.reg_number || data.username || 'Authenticated User',
      username: data.username || data.reg_number,
      role: 'student',
    };
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: RegisterData) => {
    await api.register(data);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        register,
        logout,
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
