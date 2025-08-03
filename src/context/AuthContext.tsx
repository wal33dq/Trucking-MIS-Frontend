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
  isLoading: boolean; // <-- ADDED: To track initial auth state check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <-- ADDED: Start in a loading state

  // This effect runs only once on app start-up to check for an existing token.
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // You might want to add token expiration check here as well
          const decoded: { sub: string; email: string; role: Role, name: string } = jwtDecode(storedToken);
          setUser({ _id: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name });
          setToken(storedToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } catch (error) {
          console.error("Invalid token on initial load, logging out:", error);
          // Clear out any invalid token and state
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      // Finished checking, set loading to false
      setIsLoading(false);
    };

    initializeAuth();
  }, []); // <-- Empty dependency array means this runs only once on mount

  const login = async (credentials: any) => {
    const response = await apiLogin(credentials);
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    const decoded: { sub: string; email: string; role: Role, name: string } = jwtDecode(access_token);
    setUser({ _id: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name });
    setToken(access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  // The value provided to the context consumers
  const contextValue = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading // <-- ADDED: Expose loading state
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
