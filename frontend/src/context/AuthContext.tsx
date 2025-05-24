// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'; // Added useCallback
import type { ReactNode } from 'react';
import apiClient from '../api';
// Make sure these types are defined in frontend/src/types/auth.ts
import type { User, LoginCredentials, RegisterCredentials } from '../types/auth'; 

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean; // Indicates if the initial auth state is being loaded
  apiClient: typeof apiClient;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true, as we're loading user from localStorage

  // This useEffect runs once on mount to load user from local storage
  useEffect(() => {
    const loadUserFromLocalStorage = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');

        // --- IMPORTANT: Robust check for valid data ---
        if (storedUser && storedUser !== "undefined" && storedUser !== "null" && storedAccessToken) {
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
        } else {
          // If no valid user or token, ensure local storage is clean
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        // On error, clear storage to prevent infinite issues and set user to null
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setUser(null);
      } finally {
        setLoading(false); // Authentication loading is complete
      }
    };

    loadUserFromLocalStorage();
  }, []); // Empty dependency array means it runs only once on component mount

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      // --- CAPTURE THE RESPONSE HERE ---
      const response = await apiClient.post<{ user: User; accessToken: string }>('/auth/login', credentials);

      // --- ADD THE SUCCESS LOGIC HERE ---
      const { user, accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user)); // Store user data
      setUser(user); // Update user state in context
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`; // Set Authorization header for future requests

    } catch (error: any) {
      console.error('Login failed:', error);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.response && error.response.data && error.response.data.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message === 'Network Error') {
          errorMessage = 'Network Error: Could not connect to the server.';
      } else {
          errorMessage = error.message; // Catch generic JS errors too
      }

      // Important: On login failure, ensure no stale data remains
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null); // Clear user state
      throw new Error(errorMessage); // Re-throw the refined error
    } finally {
      setLoading(false);
    }
  }, [setUser]); 

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setLoading(true); // Indicate loading during registration
    try {
      // Assuming register endpoint also returns user and token for auto-login
      const response = await apiClient.post<{ user: User; accessToken: string }>('/auth/register', credentials);
      const { user, accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    } finally {
      setLoading(false); // Registration attempt finished
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    // No need to set loading here, as user is immediately null and UI should react
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      register,
      logout,
      loading,
      apiClient // <--- ADD THIS LINE
    }}>
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