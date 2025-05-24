// frontend/src/pages/dashboards/AdminDashboard.tsx
import React from 'react';

function AdminDashboard() {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h3>
      <p className="text-gray-700 mb-2">
        Welcome, Administrator! Here you can manage all users, staff, services, and overall system settings.
      </p>
      <p className="text-gray-700">
        Upcoming features: <span className="font-semibold">User Management</span>, <span className="font-semibold">Service Configuration</span>, <span className="font-semibold">System Analytics</span>.
      </p>
    </div>
  );
}

export default AdminDashboard;
