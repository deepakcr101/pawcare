// frontend/src/pages/DashboardPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OwnerDashboard from './dashboards/OwnerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import StaffDashboard from './dashboards/StaffDashboard';
import type { Role } from '../types/auth';

function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else {
        switch (user.role) {
          case 'OWNER':
          case 'ADMIN':
          case 'CLINIC_STAFF':
            // Stay on this page, dashboard will render below
            break;
          default:
            console.warn('User has an unhandled role:', user.role);
            navigate('/unauthorized');
            break;
        }
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
        <p className="text-lg text-gray-600">Loading authentication status...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
        <p className="text-lg text-red-600">Not authenticated. Redirecting...</p>
      </div>
    );
  }

  switch (user.role) {
    case 'OWNER':
      return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
          <OwnerDashboard />
        </div>
      );
    case 'ADMIN':
      return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
          <AdminDashboard />
        </div>
      );
    case 'CLINIC_STAFF':
      return (
        <div className="max-w-7xl mx-auto p-6 mt-10">
          <StaffDashboard />
        </div>
      );
    default:
      return (
        <div className="max-w-md mx-auto p-6 bg-yellow-100 rounded-lg shadow-md mt-10 text-center">
          <p className="text-lg text-yellow-700 mb-4">
            Access Denied: Your role does not have a defined dashboard.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Go to Login
          </button>
        </div>
      );
  }
}

export default DashboardPage;
