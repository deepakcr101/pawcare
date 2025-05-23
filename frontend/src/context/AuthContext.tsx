// frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { loginUser, registerUser } from '../api/auth'; // Re-use our auth API calls

// Define the User interface based on your backend's user response
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string; // e.g., 'OWNER', 'ADMIN', 'CLINIC_STAFF', 'GROOMER'
}

// Define the shape of our authentication context
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean; // To indicate if initial loading (checking local storage) is happening
}

// Create the context with a default undefined value (will be provided by provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap our application
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state

  // On component mount, try to load user from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setAccessToken(storedToken);
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false); // Finished initial loading
  }, []); // Run only once on mount

  const handleLogin = async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setAccessToken(response.accessToken);
  };

  const handleRegister = async (userData: any) => {
    const response = await registerUser(userData);
    // For registration, we typically don't log in immediately,
    // but you could add a login here if that's your UX.
    // For now, we'll just return the response to the caller.
    return response; // Caller handles redirection/success message
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    setAccessToken(null);
  };

  const contextValue: AuthContextType = {
    user,
    accessToken,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
