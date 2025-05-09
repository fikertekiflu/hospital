import React, { useState } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../../hooks/useAuth'; // To get current user's role


// import AdminSidebar from './AdminSidebar'; 
// import DoctorSidebar from './DoctorSidebar'; 
// import NurseSidebar from './NurseSidebar'; 
import ReceptionistSidebar from './ReceptionistSidebar';
// import WardBoySidebar from './WardBoySidebar';
// import BillingStaffSidebar from './BillingStaffSidebar';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const MainLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile sidebar toggle

  const renderSidebar = () => {
    if (!currentUser) return null; // No sidebar if not logged in (shouldn't happen in protected routes)

    switch (currentUser.role) {
    //   case 'Admin':
    //     return <AdminSidebar />;
    //   case 'Doctor':
    //     return <DoctorSidebar />;
    //   case 'Nurse':
    //     return <NurseSidebar />;
      case 'Receptionist':
        return <ReceptionistSidebar />;
      // case 'WardBoy':
      //   return <WardBoySidebar />;
      // case 'BillingStaff':
      //   return <BillingStaffSidebar />;
      default:
        // A default minimal sidebar or null if no specific sidebar for a role
        return (
          <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-slate-700 border-r border-slate-600">
             <div className="px-4 py-2 text-slate-300">No specific sidebar for {currentUser.role}</div>
          </nav>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar (can include mobile menu button) */}
      <Navbar onMenuButtonClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        {/* Static sidebar for desktop */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            {renderSidebar()}
          </div>
        </aside>

        {/* Mobile sidebar (drawer) */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 flex z-40">
            {/* Overlay */}
            <div className="fixed inset-0">
              <div className="absolute inset-0 bg-gray-600 opacity-75" onClick={() => setSidebarOpen(false)}></div>
            </div>
            {/* Sidebar */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-700">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              {renderSidebar()}
            </div>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
