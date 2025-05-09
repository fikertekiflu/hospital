import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios'; // Or your preferred API client
import { format } from 'date-fns'; // For formatting dates
import {
  UserPlusIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Get API URL from environment variables (Vite example)
const API_BASE_URL =  'http://localhost:3000/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-20`}>
        <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const ReceptionistDashboardPage = () => {
  const { currentUser, token } = useAuth();
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [quickStats, setQuickStats] = useState({ checkedIn: 0, scheduledToday: 0 }); // Example stats

  useEffect(() => {
    const fetchTodaysAppointments = async () => {
      if (!token) return;
      setIsLoadingAppointments(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        // Assuming your API can filter by date and status. Adjust if needed.
        const response = await axios.get(`${API_BASE_URL}/appointment?date=${today}&status=Scheduled,Checked-In`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // You might need a more specific endpoint or client-side filtering if the above isn't available
        // For now, let's assume the above fetches relevant appointments for the whole hospital for today
        // A better endpoint would be /api/appointments/today or similar
        setTodaysAppointments(response.data.filter(appt => ['Scheduled', 'Checked-In'].includes(appt.status)).slice(0, 5)); // Show top 5
        setQuickStats(prev => ({ ...prev, scheduledToday: response.data.length }));

      } catch (error) {
        console.error("Error fetching today's appointments:", error);
        toast.error("Could not fetch today's appointments.");
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchTodaysAppointments();
    // Fetch other stats if needed
  }, [token]);

  const handleCheckIn = async (appointmentId) => {
    if (!token) return;
    try {
      // API call to update appointment status to 'Checked-In' or similar
      // POST /api/appointments/:appointmentId/check-in or PUT /api/appointments/:appointmentId/status
      toast.success(`Patient for appointment ${appointmentId} checked in (simulated).`);
      // Refetch appointments or update local state
      // For now, just a placeholder
      setTodaysAppointments(prev => prev.map(appt => 
        appt.appointment_id === appointmentId ? { ...appt, status: 'Checked-In' } : appt
      ));
      setQuickStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));

    } catch (error) {
      console.error("Error checking in patient:", error);
      toast.error("Failed to check in patient.");
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Receptionist Dashboard</h1>
        <p className="mt-1 text-slate-600">Welcome back, {currentUser?.full_name || currentUser?.username}!</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/patients/new" className="block p-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform transform hover:scale-105">
          <UserPlusIcon className="h-10 w-10 mb-2" />
          <h3 className="font-semibold text-lg">Register New Patient</h3>
          <p className="text-sm text-indigo-200">Add a new patient to the system.</p>
        </Link>
        <Link to="/appointments/schedule" className="block p-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-lg transition-transform transform hover:scale-105">
          <CalendarDaysIcon className="h-10 w-10 mb-2" />
          <h3 className="font-semibold text-lg">Schedule Appointment</h3>
          <p className="text-sm text-sky-100">Book a new appointment for a patient.</p>
        </Link>
        <Link to="/patients" className="block p-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-transform transform hover:scale-105">
          <MagnifyingGlassIcon className="h-10 w-10 mb-2" />
          <h3 className="font-semibold text-lg">Search Patients</h3>
          <p className="text-sm text-emerald-100">Find existing patient records.</p>
        </Link>
         <Link to="/appointments/manage" className="block p-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg transition-transform transform hover:scale-105">
          <ClipboardDocumentListIcon className="h-10 w-10 mb-2" />
          <h3 className="font-semibold text-lg">Manage Appointments</h3>
          <p className="text-sm text-amber-100">View and update appointment statuses.</p>
        </Link>
      </div>

      {/* Stats Overview - Example */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Patients Checked-In Today" value={quickStats.checkedIn} icon={CheckCircleIcon} color="border-green-500" />
        <StatCard title="Appointments Scheduled Today" value={quickStats.scheduledToday} icon={UserGroupIcon} color="border-blue-500" />
      </div>


      {/* Today's Appointments Overview */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">Today's Upcoming/Checked-In Appointments</h2>
        {isLoadingAppointments ? (
          <p className="text-slate-500">Loading appointments...</p>
        ) : todaysAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todaysAppointments.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{format(new Date(appt.appointment_datetime), 'p')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.patient_first_name} {appt.patient_last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dr. {appt.doctor_first_name} {appt.doctor_last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{appt.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        appt.status === 'Checked-In' ? 'bg-green-100 text-green-800' :
                        appt.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800' // Cancelled or No Show
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {appt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleCheckIn(appt.appointment_id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Check-In
                        </button>
                      )}
                      <Link to={`/appointments/${appt.appointment_id}/details`} className="text-teal-600 hover:text-teal-900">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No upcoming or checked-in appointments for today.</p>
        )}
      </div>
    </div>
  );
};

export default ReceptionistDashboardPage;
