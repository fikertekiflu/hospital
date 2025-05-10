import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, // For Dashboard
  CalendarDaysIcon, // For My Schedule / Appointments
  UserGroupIcon, // For Patient Records
  PencilSquareIcon, // For Logging Treatments or Notes
  UserCircleIcon, // For My Account (kept as a common minimal item)
} from '@heroicons/react/24/outline';

// Revised navigation for a Doctor, focusing on implemented backend functionalities
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Schedule', href: '/doctor/my-schedule', icon: CalendarDaysIcon }, // Page to view/manage their appointments
  { name: 'Patient Records', href: '/patients', icon: UserGroupIcon }, // Link to patient search/list page
  
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const DoctorSidebar = () => {
  const location = useLocation();

  // Update 'current' status based on location
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href ||
             (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && item.href.length > 1) ||
             (item.href === '/patients' && location.pathname.startsWith('/patients'))
  }));

  return (
    <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-sky-700 to-sky-900 border-r border-sky-700 shadow-lg">
      <div className="flex items-center flex-shrink-0 px-4 mb-10">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
        <span className="text-xl font-semibold text-white tracking-tight">Doctor's Portal</span>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="space-y-2 px-3">
          {updatedNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                item.current
                  ? 'bg-sky-800 text-white shadow-md'
                  : 'text-sky-100 hover:bg-sky-600 hover:text-white hover:shadow-sm',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              <item.icon
                className={classNames(
                  item.current
                    ? 'text-white'
                    : 'text-sky-300 group-hover:text-sky-100',
                  'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      {/* "My Account" is now part of the main navigation, so the footer link might be redundant or different */}
      {/* You could keep a simplified footer or remove it if the main nav covers it */}
       <div className="flex-shrink-0 px-3 pt-4 mt-auto border-t border-sky-700">
         <span className="block px-3 py-2 text-xs text-sky-400 font-medium uppercase">Support</span>
          <Link
            to="/help" // Example help link
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-sky-200 hover:bg-sky-600 hover:text-white"
          >
            Help & Documentation
          </Link>
      </div>
    </nav>
  );
};

export default DoctorSidebar;
