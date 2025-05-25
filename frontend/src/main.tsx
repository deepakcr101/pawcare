// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.tsx'; // Import AuthProvider

const queryClient = new QueryClient();


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* Wrap your App with AuthProvider */}
      <App />
    </AuthProvider>,
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Ensure AuthProvider wraps App if it provides user context */}
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);