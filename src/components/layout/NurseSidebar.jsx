import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, // For Dashboard
  ClipboardDocumentListIcon, // For My Tasks/Assignments
  UserGroupIcon, // For Patient Lookup
  BellIcon, // For Alerts (future)
  UserCircleIcon, // For My Profile
  RectangleStackIcon, // For Ward/Unit Overview (optional)
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Active Tasks', href: '/assignments/my-tasks', icon: ClipboardDocumentListIcon },
  { name: 'Patient Lookup', href: '/patients', icon: UserGroupIcon },
  // { name: 'Ward Overview', href: '/nurses/ward-overview', icon: RectangleStackIcon }, // Optional, if nurses are assigned to specific wards
  // { name: 'Alerts', href: '/nurses/alerts', icon: BellIcon }, // Placeholder for future alert system
  
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const NurseSidebar = () => {
  const location = useLocation();

  // Update 'current' status based on location
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href ||
             (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && item.href.length > 1) ||
             (item.href === '/patients' && location.pathname.startsWith('/patients'))
  }));

  return (
    <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-teal-600 to-emerald-700 border-r border-teal-700 shadow-lg">
      <div className="flex items-center flex-shrink-0 px-4 mb-10">
        {/* You can add a logo or hospital name specific to the sidebar here if needed */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <span className="text-xl font-semibold text-white tracking-tight">Nurse Station</span>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="space-y-2 px-3">
          {updatedNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                item.current
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'text-teal-100 hover:bg-teal-500 hover:text-white hover:shadow-sm',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              <item.icon
                className={classNames(
                  item.current
                    ? 'text-white'
                    : 'text-teal-200 group-hover:text-teal-100',
                  'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 px-3 pt-4 mt-auto border-t border-teal-700">
         <Link
            to="/profile/settings"
            className={classNames(
                location.pathname === "/profile/settings"
                 ? 'bg-teal-700 text-white shadow-md'
                 : 'text-teal-100 hover:bg-teal-500 hover:text-white hover:shadow-sm',
                "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-150 ease-in-out"
            )}
          >
            <UserCircleIcon className={classNames(location.pathname === "/profile/settings" ? "text-white" : "text-teal-200 group-hover:text-teal-100", "mr-3 h-6 w-6")} />
            My Account
          </Link>
      </div>
    </nav>
  );
};

export default NurseSidebar;
