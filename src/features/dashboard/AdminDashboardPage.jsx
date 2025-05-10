import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns'; // For today's date
import {
  UsersIcon as SystemUsersIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon, 
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon, 
  ClipboardDocumentCheckIcon 
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable StatCard component (remains the same as before)
const StatCard = ({ title, value, icon: Icon, color, isLoading, unit = "", description, href }) => {
  const cardContent = (
    <div className={`bg-white p-5 rounded-xl shadow-lg border-l-4 ${color} flex flex-col justify-between h-full hover:shadow-xl transition-shadow duration-300`}>
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <div className={`p-2 rounded-full ${color.replace('border-', 'bg-')} bg-opacity-10 flex-shrink-0`}>
            <Icon className={`h-5 w-5 ${color.replace('border-', 'text-')}`} />
          </div>
        </div>
        {isLoading ? (
          <div className="mt-1 h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}{unit}</p>
        )}
      </div>
      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  );
  return href ? <Link to={href} className="block h-full">{cardContent}</Link> : cardContent;
};

// Reusable ActionCard component (remains the same as before)
const ActionCard = ({ title, description, href, icon: Icon, bgColor, hoverBgColor, textColor = "text-white", iconColor }) => (
  <Link
    to={href}
    className={`group block p-6 ${bgColor} ${hoverBgColor} ${textColor} rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-full flex flex-col`}
  >
    <Icon className={`h-10 w-10 mb-4 ${iconColor || textColor} group-hover:scale-110 transition-transform`} />
    <h3 className="font-semibold text-lg mb-1">{title}</h3>
    <p className={`text-sm ${textColor} opacity-90 mt-1 flex-grow`}>{description}</p>
    <div className="mt-auto pt-3 text-right">
        <span className={`text-xs font-medium ${textColor} opacity-75 group-hover:opacity-100`}>Manage &rarr;</span>
    </div>
  </Link>
);


const AdminDashboardPage = () => {
  const { currentUser, token } = useAuth();

  // MODIFIED: Fetch Dashboard Statistics by making individual API calls
  const fetchAdminDashboardStats = async () => {
    if (!token) return {
      totalUsers: 0, totalPatients: 0, totalDoctors: 0, totalNurses: 0,
      totalWardBoys: 0, totalRooms: 0, occupiedRooms: 0, appointmentsToday: 0,
      activeAdmissions: 0
    };

    const headers = { Authorization: `Bearer ${token}` };
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      const [
        usersResponse,
        patientsResponse,
        doctorsResponse,
        nursesResponse,
        wardBoysResponse,
        roomsResponse,
        appointmentsTodayResponse,
        activeAdmissionsResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/users`, { headers }), // Assumes GET /api/users lists all system users (Admin only)
        axios.get(`${API_BASE_URL}/patient`, { headers }), // Assumes GET /api/patients lists all patients
        axios.get(`${API_BASE_URL}/doctor?is_active=true`, { headers }), // Assumes GET /api/doctors lists active doctors
        axios.get(`${API_BASE_URL}/nurse?is_active=true`, { headers }), // Assumes GET /api/nurses lists active nurses
        axios.get(`${API_BASE_URL}/wardboy?is_active=true`, { headers }), // Assumes GET /api/wardboys lists active ward boys
        axios.get(`${API_BASE_URL}/room?is_active=true`, { headers }), // Assumes GET /api/rooms lists active rooms
        axios.get(`${API_BASE_URL}/appointment`, { headers, params: { dateFrom: todayStr, dateTo: todayStr } }), // Assumes GET /api/appointments can filter by date range
        axios.get(`${API_BASE_URL}/admission?status=active`, { headers }) // Assumes GET /api/admissions can filter by active status (discharge_datetime IS NULL)
      ]);

      let occupiedRoomsCount = 0;
      if (roomsResponse.data && Array.isArray(roomsResponse.data)) {
        occupiedRoomsCount = roomsResponse.data.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
      }
      
      return {
        totalUsers: usersResponse.data?.length || 0,
        totalPatients: patientsResponse.data?.length || 0,
        totalDoctors: doctorsResponse.data?.length || 0,
        totalNurses: nursesResponse.data?.length || 0,
        totalWardBoys: wardBoysResponse.data?.length || 0,
        totalRooms: roomsResponse.data?.length || 0,
        occupiedRooms: occupiedRoomsCount,
        appointmentsToday: appointmentsTodayResponse.data?.length || 0,
        activeAdmissions: activeAdmissionsResponse.data?.length || 0
      };
    } catch (error) {
      console.error("Error fetching admin dashboard stats (individual calls):", error.response?.data?.message || error.message);
      toast.error("Could not load some dashboard statistics.");
      return {
        totalUsers: 0, totalPatients: 0, totalDoctors: 0, totalNurses: 0,
        totalWardBoys: 0, totalRooms: 0, occupiedRooms: 0, appointmentsToday: 0,
        activeAdmissions: 0
      };
    }
  };

  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['adminDashboardStatsIndividual'], // Changed queryKey to reflect new fetching method
    queryFn: fetchAdminDashboardStats,
    enabled: !!token && currentUser?.role === 'Admin',
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });


  const managementSections = [
    { title: "System Users", description: "Manage login accounts, roles, and user permissions.", href: "/admin/users", icon: Cog6ToothIcon, bgColor: "bg-sky-600", hoverBgColor: "hover:bg-sky-700", iconColor:"text-sky-100" },
    { title: "Staff Profiles", description: "Oversee Doctors, Nurses, and Ward Boys professional details and link to logins.", href: "/admin/staff", icon: BriefcaseIcon, bgColor: "bg-teal-600", hoverBgColor: "hover:bg-teal-700", iconColor:"text-teal-100" },
    { title: "Patient Records", description: "View all patient demographic and basic records (Admin view).", href: "/patients", icon: UserGroupIcon, bgColor: "bg-indigo-600", hoverBgColor: "hover:bg-indigo-700", iconColor:"text-indigo-100" },
    { title: "Hospital Rooms", description: "Define, update, and track status of hospital rooms.", href: "/admin/rooms", icon: BuildingOfficeIcon, bgColor: "bg-purple-600", hoverBgColor: "hover:bg-purple-700", iconColor:"text-purple-100" },
    { title: "Billable Services", description: "Manage services and their pricing for billing.", href: "/admin/services", icon: CurrencyDollarIcon, bgColor: "bg-emerald-600", hoverBgColor: "hover:bg-emerald-700", iconColor:"text-emerald-100" },
    { title: "Admissions Overview", description: "View and manage current and past patient admissions.", href: "/admin/admissions", icon: ClipboardDocumentCheckIcon, bgColor: "bg-rose-600", hoverBgColor: "hover:bg-rose-700", iconColor:"text-rose-100" },
    // { title: "System Reports", description: "View key operational and financial reports.", href: "/admin/reports", icon: ChartBarIcon, bgColor: "bg-slate-600", hoverBgColor: "hover:bg-slate-700", iconColor:"text-slate-100" }, // For future
  ];

  return (
    <div className="space-y-10 p-1 animate-fadeIn">
      <header className="mb-6">
        <div className="flex items-center">
            <ShieldCheckIcon className="h-10 w-10 text-indigo-600 mr-3"/>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Administrator Dashboard</h1>
        </div>
        <p className="mt-2 text-lg text-slate-600">
          Welcome, {currentUser?.full_name || currentUser?.username}! System overview and management tools.
        </p>
      </header>

      {/* System Statistics Section */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-700 mb-5">System At a Glance</h2>
        {isLoadingStats && !stats && ( 
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(6)].map((_, i) => ( 
                    <div key={i} className="bg-white p-5 rounded-xl shadow-lg border-l-4 border-gray-300">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-8 w-1/2 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                ))}
            </div>
        )}
        {!isLoadingStats && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            <StatCard title="Total System Users" value={stats?.totalUsers || 0} icon={SystemUsersIcon} color="border-blue-500" isLoading={isLoadingStats} href="/admin/users" />
            <StatCard title="Registered Patients" value={stats?.totalPatients || 0} icon={UserGroupIcon} color="border-green-500" isLoading={isLoadingStats} href="/patients" />
            <StatCard 
                title="Total Active Staff" 
                value={(stats?.totalDoctors || 0) + (stats?.totalNurses || 0) + (stats?.totalWardBoys || 0)} 
                icon={BriefcaseIcon} 
                color="border-purple-500" 
                isLoading={isLoadingStats} 
                description={`D:${stats?.totalDoctors || 0}, N:${stats?.totalNurses || 0}, WB:${stats?.totalWardBoys || 0}`}
                href="/admin/staff"
            />
            <StatCard 
                title="Room Occupancy" 
                value={`${stats?.occupiedRooms || 0} / ${stats?.totalRooms || 0}`} 
                icon={BuildingOfficeIcon} 
                color="border-amber-500" 
                isLoading={isLoadingStats}
                description={stats?.totalRooms > 0 && stats?.occupiedRooms !== undefined ? `${((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(0)}% Full` : "N/A"}
                href="/admin/rooms"
            />
            <StatCard 
                title="Appointments Today" 
                value={stats?.appointmentsToday || 0} 
                icon={CalendarDaysIcon} 
                color="border-sky-500" 
                isLoading={isLoadingStats}
                href="/admin/appointments" 
            />
            <StatCard 
                title="Active Admissions" 
                value={stats?.activeAdmissions || 0} 
                icon={ClipboardDocumentCheckIcon} 
                color="border-rose-500" 
                isLoading={isLoadingStats}
                href="/admin/admissions" 
            />
            </div>
        )}
        {statsError && !isLoadingStats && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg shadow">
                <p><ExclamationTriangleIcon className="h-5 w-5 inline mr-2"/> Could not load system statistics. Please try again later.</p>
            </div>
        )}
      </section>

      {/* Management Sections */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-700 mb-5">Management Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementSections.map((section) => (
            <ActionCard
              key={section.title}
              title={section.title}
              description={section.description}
              href={section.href}
              icon={section.icon}
              bgColor={section.bgColor}
              hoverBgColor={section.hoverBgColor}
              iconColor={section.iconColor}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
