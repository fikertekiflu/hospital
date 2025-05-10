import React from 'react'; // Removed useState as mobile toggle is removed for now
import { useAuth } from '../../hooks/useAuth'; // To get current user's role

// Import all role-specific sidebars
import AdminSidebar from './AdminSidebar'; 
import DoctorSidebar from './DoctorSidebar'; 
import NurseSidebar from './NurseSidebar'; 
import ReceptionistSidebar from './ReceptionistSidebar';
import WardBoySidebar from './WardBoySidebar';
import BillingStaffSidebar from './BillingStaffSidebar';
// Removed Bars3Icon, XMarkIcon as mobile toggle is simplified

const MainLayout = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth(); // Added isAuthenticated

  const renderSidebar = () => {
    // Only render sidebar if authenticated and currentUser exists
    if (!isAuthenticated || !currentUser) return null; 

    switch (currentUser.role) {
      case 'Admin':
        return <AdminSidebar />;
      case 'Doctor':
        return <DoctorSidebar />;
      case 'Nurse':
        return <NurseSidebar />;
      case 'Receptionist':
        return <ReceptionistSidebar />;
      case 'WardBoy':
        return <WardBoySidebar />;
      case 'BillingStaff':
        return <BillingStaffSidebar />;
      default:
        return (
          <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-slate-700 border-r border-slate-600 w-64 md:flex md:flex-shrink-0">
             <div className="px-4 py-2 text-slate-300">No specific sidebar for {currentUser.role}</div>
          </nav>
        );
    }
  };

  const sidebarComponent = renderSidebar();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 4rem)' }}> {/* Adjust 4rem if footer height changes */}
        {/* Static sidebar for desktop, only if sidebarComponent exists */}
        {sidebarComponent && (
          <aside className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64 h-full fixed top-0 left-0 pt-0"> {/* Sidebar takes full height */}
              {sidebarComponent}
            </div>
          </aside>
        )}

        {/* Main content area, adjust margin if sidebar is present */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto ${sidebarComponent ? 'md:ml-64' : ''}`}>
          {children}
        </main>
      </div>
      <footer className="bg-slate-800 text-slate-300 text-center p-4 text-sm h-16"> {/* Fixed height for footer */}
        © {new Date().getFullYear()} Hospital Management System. All rights reserved.
      </footer>
    </div>
  );
};

export default MainLayout;

