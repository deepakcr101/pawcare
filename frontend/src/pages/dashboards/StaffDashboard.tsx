// frontend/src/pages/dashboards/StaffDashboard.tsx
import React from 'react';

interface StaffDashboardProps {
  role: string; // To differentiate between CLINIC_STAFF and GROOMER if needed
}

function StaffDashboard({ role }: StaffDashboardProps) {
  // Capitalize role nicely (e.g., CLINIC_STAFF → Clinic Staff)
  const displayRole = role
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">{displayRole} Dashboard</h3>
      <p className="text-gray-700 mb-2">
        Welcome, {displayRole}! Here you can manage appointments, daycare bookings, and pet activities.
      </p>
      <div className="mt-4 p-4 bg-gray-50 border border-dashed border-gray-300 rounded">
        <h4 className="text-lg font-semibold text-gray-700 mb-2">Upcoming Features</h4>
        <ul className="list-disc list-inside text-gray-600">
          <li>Appointment Schedule</li>
          <li>Daycare Check-in/Check-out</li>
          <li>Activity Logging</li>
        </ul>
      </div>
    </div>
  );
}

export default StaffDashboard;
