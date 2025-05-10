import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon, // For Dashboard
  DocumentPlusIcon, // For Generate Bill
  CurrencyDollarIcon, // For Record Payment
  ArchiveBoxIcon, // For Manage Bills (Archive/Records)
  RectangleStackIcon, // For View Services (Price List)
  ChartBarIcon, // For Billing Reports
  UserCircleIcon, // For My Profile
} from '@heroicons/react/24/outline';

// Navigation items for Billing Staff
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Generate Bill', href: '/billing/generate', icon: DocumentPlusIcon },
  { name: 'Record Payment', href: '/billing/payment', icon: CurrencyDollarIcon },
  { name: 'Manage Bills', href: '/billing/manage-bills', icon: ArchiveBoxIcon },
  { name: 'View Services', href: '/services/view', icon: RectangleStackIcon }, // Link to a page showing all billable services
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const BillingStaffSidebar = () => {
  const location = useLocation();

  // Update 'current' status based on location
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current: location.pathname === item.href ||
             (item.href !== '/dashboard' && location.pathname.startsWith(item.href) && item.href.length > 1)
  }));

  return (
    <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-blue-700 to-blue-900 border-r border-blue-700 shadow-lg">
      <div className="flex items-center flex-shrink-0 px-4 mb-10">
        {/* You can add a logo or hospital name specific to the sidebar here if needed */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6A.75.75 0 0 1 2.25 5.25V4.5m0 13.5V12A2.25 2.25 0 0 0 0 9.75m1.5_9V9.75M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 0v-3A2.25 2.25 0 0 0 12.75 1.5h-3.5A2.25 2.25 0 0 0 7 3.75v3M12 12.75a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        </svg>
        <span className="text-xl font-semibold text-white tracking-tight">Billing Office</span>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="space-y-2 px-3">
          {updatedNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                item.current
                  ? 'bg-blue-800 text-white shadow-md'
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-sm',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-150 ease-in-out'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              <item.icon
                className={classNames(
                  item.current
                    ? 'text-white'
                    : 'text-blue-300 group-hover:text-blue-100',
                  'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 px-3 pt-4 mt-auto border-t border-blue-700">
         <Link
            to="/profile/settings"
            className={classNames(
                location.pathname === "/profile/settings"
                 ? 'bg-blue-800 text-white shadow-md'
                 : 'text-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-sm',
                "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-150 ease-in-out"
            )}
          >
            <UserCircleIcon className={classNames(location.pathname === "/profile/settings" ? "text-white" : "text-blue-300 group-hover:text-blue-100", "mr-3 h-6 w-6")} />
            My Account
          </Link>
      </div>
    </nav>
  );
};

export default BillingStaffSidebar;
