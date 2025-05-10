import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, // For Dashboard
  ClipboardDocumentListIcon, // For My Tasks/Assignments
  UserGroupIcon, // For Patient Lookup (general access)
  WrenchScrewdriverIcon, // For Reporting Issues or Equipment status
  UserCircleIcon, // For My Profile
  InformationCircleIcon // For Help or Information
} from '@heroicons/react/24/outline';

// Navigation items for a Ward Boy
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'My Active Tasks', href: '/assignments/my-tasks', icon: ClipboardDocumentListIcon },
  { name: 'Patient Lookup', href: '/patients', icon: UserGroupIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const WardBoySidebar = () => {
  const location = useLocation();

  // Update 'current' status based on location
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href ||
             (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && item.href.length > 1) ||
             (item.href === '/patients' && location.pathname.startsWith('/patients'))
  }));

  return (
    <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-slate-600 to-slate-800 border-r border-slate-700 shadow-lg">
      <div className="flex items-center flex-shrink-0 px-4 mb-10">
        {/* You can use a more generic hospital icon or a specific one for support staff */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375m-6.375 3h6.375m-6.375 3h6.375m-6.375 3h6.375M6.75 21v-2.25M17.25 21v-2.25" />
        </svg>
        <span className="text-xl font-semibold text-white tracking-tight">Ward Support</span>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="space-y-2 px-3">
          {updatedNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                item.current
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-200 hover:bg-slate-500 hover:text-white hover:shadow-sm',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              <item.icon
                className={classNames(
                  item.current
                    ? 'text-white'
                    : 'text-slate-300 group-hover:text-slate-100',
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
            to="/profile/settings" // Or a specific help page
            className={classNames(
                location.pathname === "/profile/settings"
                 ? 'bg-slate-700 text-white shadow-md'
                 : 'text-slate-200 hover:bg-slate-500 hover:text-white hover:shadow-sm',
                "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-150 ease-in-out"
            )}
          >
            <UserCircleIcon className={classNames(location.pathname === "/profile/settings" ? "text-white" : "text-slate-300 group-hover:text-slate-100", "mr-3 h-6 w-6")} />
            My Account
          </Link>
      </div>
    </nav>
  );
};

export default WardBoySidebar;
