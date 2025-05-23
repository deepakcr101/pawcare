// frontend/src/api/auth.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Make sure this matches your backend URL

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    // Add other user fields as needed from your backend's login response
  };
}

export const registerUser = async (userData: any): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials: any): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};