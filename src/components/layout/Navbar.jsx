import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  UsersIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  Bars3Icon, // For mobile menu toggle
} from '@heroicons/react/24/outline'; // Using outline for consistency
import toast from 'react-hot-toast';


const Navbar = ({ onMenuButtonClick }) => { // Accept onMenuButtonClick prop
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Toast is now handled in AuthContext's logout
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-lg sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Mobile menu button and Logo */}
          <div className="flex items-center">
            <button
              onClick={onMenuButtonClick}
              className="md:hidden mr-3 p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-2xl font-bold tracking-tight hover:text-indigo-200 transition-colors">
              Hospital MS
            </Link>
          </div>

          {/* Right side: Links and User Info */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {isAuthenticated && currentUser ? (
              <>
                {/* Role-specific quick links - could be a dropdown menu for more items */}
                {currentUser.role === 'Admin' && (
                  <Link to="/admin/users" title="Manage Users" className="p-2 rounded-full hover:bg-indigo-800 transition-colors hidden sm:inline-block">
                    <UsersIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </Link>
                )}
                {(currentUser.role === 'Receptionist' || currentUser.role === 'Admin') && (
                  <Link to="/appointments/schedule" title="Schedule Appointment" className="p-2 rounded-full hover:bg-indigo-800 transition-colors hidden sm:inline-block">
                     <CalendarDaysIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </Link>
                )}
                 {(currentUser.role === 'Nurse' || currentUser.role === 'WardBoy') && (
                  <Link to="/assignments/my-tasks" title="My Tasks" className="p-2 rounded-full hover:bg-indigo-800 transition-colors hidden sm:inline-block">
                     <ListBulletIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </Link>
                )}

                <span className="text-sm text-indigo-100 hidden lg:block">
                  {currentUser.full_name || currentUser.username} ({currentUser.role})
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-full hover:bg-red-500 hover:bg-opacity-90 transition-colors flex items-center"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 md:h-6 md:w-6" />
                  <span className="ml-1 md:ml-2 text-xs md:text-sm hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800 transition-colors">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
