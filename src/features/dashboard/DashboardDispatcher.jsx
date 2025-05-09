// src/features/dashboard/DashboardDispatcher.jsx (Updated)
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
// import AdminDashboardPage from './AdminDashboardPage'; // Create these
// import DoctorDashboardPage from './DoctorDashboardPage';
// import NurseDashboardPage from './NurseDashboardPage';
import ReceptionistDashboardPage from './ReceptionistDashboardPage'; // Import the new one

function DashboardDispatcher() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <p className="p-6 text-center text-gray-700">Loading user data or not authenticated...</p>;
  }

  switch (currentUser.role) {
    // case 'Admin':
    //   return <AdminDashboardPage />;
    // case 'Doctor':
    //   return <DoctorDashboardPage />;
    // case 'Nurse':
    //   return <NurseDashboardPage />;
    case 'Receptionist':
      return <ReceptionistDashboardPage />; // Render the specific dashboard
    // Add other roles
    default:
      return (
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome, {currentUser.full_name || currentUser.username}!</h1>
          <p className="text-gray-600">Your role is: {currentUser.role}. Dashboard not yet configured.</p>
        </div>
      );
  }
}

export default DashboardDispatcher;