import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UserPlusIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'; 

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Register Patient', href: '/patients/new', icon: UserPlusIcon },
  { name: 'Schedule Appointment', href: '/appointments/schedule', icon: CalendarDaysIcon },
  { name: 'Search Patients', href: '/patients', icon: MagnifyingGlassIcon },
  { name: 'Manage Appointments', href: '/appointments/manage', icon: ClipboardDocumentListIcon }, // New route you'd create
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ReceptionistSidebar = () => {
  const location = useLocation();

  return (
    <nav className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-slate-700 to-slate-800 border-r border-slate-600">
      <div className="flex items-center flex-shrink-0 px-4 mb-8">
        {/* You can add a logo or hospital name specific to the sidebar here if needed */}
        <span className="text-xl font-semibold text-white">Reception Desk</span>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="space-y-1 px-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={classNames(
                location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-300 hover:bg-slate-600 hover:text-white',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors duration-150'
              )}
            >
              <item.icon
                className={classNames(
                  location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
                    ? 'text-white'
                    : 'text-slate-400 group-hover:text-slate-300',
                  'mr-3 flex-shrink-0 h-6 w-6 transition-colors duration-150'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default ReceptionistSidebar;
