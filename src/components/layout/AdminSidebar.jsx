import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, // Dashboard
  Cog6ToothIcon, // System User Management (for general system users if any, or settings)
  BriefcaseIcon, // Staff Profile Management (Doctors, Nurses, Ward Boys - includes user account creation)
  // UserGroupIcon, // Patient Records/Management - Removed direct management link
  BuildingOfficeIcon, // Room Management
  CurrencyDollarIcon, // Service Management (Billing Infrastructure)
  UserCircleIcon, // My Account
  ClipboardDocumentCheckIcon, // For Manage Admissions
  ShieldCheckIcon // Used for Admin Panel title
} from '@heroicons/react/24/outline';

// Navigation items for an Admin - Refined
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Manage System Users', href: '/admin/users', icon: Cog6ToothIcon }, // For non-staff system users or advanced settings
  { name: 'Manage Staff', href: '/admin/staff', icon: BriefcaseIcon }, // Create/Edit Doctors, Nurses, WardBoys (incl. their logins)
  { name: 'Manage Rooms', href: '/admin/rooms', icon: BuildingOfficeIcon },
  { name: 'Manage Admissions', href: '/admin/admissions', icon: ClipboardDocumentCheckIcon }, // New
  { name: 'Manage Services', href: '/admin/services', icon: CurrencyDollarIcon },
  // { name: 'View Patient Records', href: '/patients', icon: UserGroupIcon }, // Optional: If admin needs read-only list access
  { name: 'My Account', href: '/profile/settings', icon: UserCircleIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminSidebar = () => {
  const location = useLocation();

  // Update 'current' status based on location
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href ||
             (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && item.href.length > 1)
  }));

  return (
    <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 shadow-xl">
      <div className="flex items-center flex-shrink-0 px-4 mb-10">
        <ShieldCheckIcon className="w-9 h-9 text-white mr-2.5" />
        <span className="text-xl font-semibold text-white tracking-tight">Admin Control Panel</span>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="space-y-1.5 px-3">
          {updatedNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                item.current
                  ? 'bg-slate-950 text-white shadow-inner' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              <item.icon
                className={classNames(
                  item.current
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-slate-100',
                  'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 px-3 pt-4 mt-auto border-t border-slate-700">
         <Link
            to="/profile/settings"
            className={classNames(
                location.pathname === "/profile/settings"
                 ? 'bg-slate-950 text-white shadow-inner'
                 : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md',
                "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-150 ease-in-out"
            )}
          >
            <UserCircleIcon className={classNames(location.pathname === "/profile/settings" ? "text-white" : "text-slate-400 group-hover:text-slate-100", "mr-3 h-6 w-6")} />
            My Account
          </Link>
      </div>
    </nav>
  );
};

export default AdminSidebar;
