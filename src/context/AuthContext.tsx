import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { login as apiLogin, api } from '../api';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decoded: { sub: string; username: string; role: Role; name: string } = jwtDecode(storedToken);
          setUser({ _id: decoded.sub, email: decoded.username, role: decoded.role, name: decoded.name });
          setToken(storedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error('Invalid token on initial load, logging out:', error);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await apiLogin(credentials);
      const { access_token } = response.data;
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      localStorage.setItem('token', access_token);
      const decoded: { sub: string; username: string; role: Role; name: string } = jwtDecode(access_token);
      setUser({ _id: decoded.sub, email: decoded.username, role: decoded.role, name: decoded.name });
      setToken(access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error; // Re-throw to be caught in LoginPage.tsx
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const contextValue = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};