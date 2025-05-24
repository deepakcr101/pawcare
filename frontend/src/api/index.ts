// frontend/src/api/index.ts (create this new file, or modify auth.ts if you only want one API file)
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Your backend URL

// Create a new Axios instance for general API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach the access token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken'); // Get token from localStorage
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`; // Add to Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// You can keep your specific auth functions here, or move them out if you prefer
// For now, let's keep them so auth.ts is the primary API file for auth-related calls
// and index.ts can be for other protected resource calls.
// If you want to merge them, you can do that too.

// Assuming you moved the loginUser and registerUser functions here:
// export const registerUser = async (userData: any) => { ... };
// export const loginUser = async (credentials: any) => { ... };


// Export the configured API client for use in other parts of your app
export default apiClient;