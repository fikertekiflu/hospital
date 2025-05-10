import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import axios from 'axios';
import { format, parseISO, isToday } from 'date-fns';
import {
  CalendarDaysIcon,
  UserIcon as PatientIconOutline, 
  ClockIcon,
  EyeIcon,
  PencilSquareIcon, 
  CheckCircleIcon as CheckCircleOutlineIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  VideoCameraIcon, 
  DocumentChartBarIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const StatCard = ({ title, value, icon: Icon, color, isLoading, unit = "", description }) => (
  <div className={`bg-white p-5 rounded-xl shadow-lg border-l-4 ${color} flex flex-col justify-between`}>
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-full ${color.replace('border-', 'bg-')} bg-opacity-10`}>
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

const DoctorDashboardPage = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Ensure linkedStaffId is treated as doctor_id
  const doctorId = currentUser?.linkedStaffId; 

  // Fetch today's appointments for the logged-in doctor
  const fetchTodaysAppointmentsForDoctor = async () => {
    if (!token || !doctorId) return [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Fetch appointments for the specific doctor and specific date
    const response = await axios.get(`${API_BASE_URL}/appointment/doctor/${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { date: todayStr } 
    });
    // Filter for Scheduled or Checked-In, and sort by time
    return response.data
      .filter(appt => ['Scheduled', 'Checked-In', 'In Progress'].includes(appt.status))
      .sort((a, b) => new Date(a.appointment_datetime) - new Date(b.appointment_datetime));
  };

  const { 
    data: todaysAppointments, 
    isLoading: isLoadingAppointments, 
    error: appointmentsError,
    refetch: refetchAppointments 
  } = useQuery({
    queryKey: ['todaysAppointmentsForDoctor', doctorId, format(new Date(), 'yyyy-MM-dd')], 
    queryFn: fetchTodaysAppointmentsForDoctor,
    enabled: !!token && !!doctorId, 
    refetchInterval: 60000, 
    refetchOnWindowFocus: true,
  });

  // Mutation for updating appointment status
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: ({ appointmentId, status }) => axios.put(`${API_BASE_URL}/appointment/${appointmentId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    onSuccess: (data, variables) => {
      toast.success(`Appointment status updated to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['todaysAppointmentsForDoctor', doctorId] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update appointment status.');
    }
  });

  useEffect(() => {
    if (appointmentsError) {
      toast.error(`Appointments: ${appointmentsError.message || 'Could not load schedule.'}`);
    }
  }, [appointmentsError]);

  const handleStartConsultation = (appointmentId) => {
    updateAppointmentStatusMutation.mutate({ appointmentId, status: 'In Progress' });
  };
  
  const handleCompleteConsultation = (appointmentId, patientId) => {
    updateAppointmentStatusMutation.mutate({ appointmentId, status: 'Completed' });
    navigate(`/treatments/new?patientId=${patientId}&appointmentId=${appointmentId}`);
  };

  const getStatusPillClasses = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-700';
      case 'Checked-In': return 'bg-yellow-100 text-yellow-700';
      case 'In Progress': return 'bg-teal-100 text-teal-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!currentUser?.isLoading && !doctorId) { 
    return (
        <div className="p-6 sm:p-8 bg-white rounded-lg shadow-xl max-w-lg mx-auto mt-10 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Profile Not Linked</h2>
            <p className="mt-2 text-slate-600">
                Your system user account is not yet linked to a Doctor's professional profile. 
                This is required to access your dashboard and schedule.
            </p>
            <p className="mt-2 text-slate-600">
                Please contact an administrator to set up or link your professional profile.
            </p>
        </div>
    );
  }

  const upcomingAppointments = todaysAppointments?.filter(appt => new Date(appt.appointment_datetime) >= new Date()) || [];
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  return (
    <div className="space-y-8 p-1 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Doctor's Dashboard</h1>
        <p className="mt-2 text-lg text-slate-600">
          Welcome back, Dr. {currentUser?.full_name || currentUser?.username}! Manage your day effectively.
        </p>
      </header>

      {/* Quick Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Today's Appointments" 
          value={todaysAppointments?.length || 0} 
          icon={CalendarDaysIcon} 
          color="border-sky-500" 
          isLoading={isLoadingAppointments}
          description="Scheduled & Checked-In"
        />
        <StatCard 
          title="Next Appointment" 
          value={nextAppointment ? format(parseISO(nextAppointment.appointment_datetime), 'p') : 'None'} 
          icon={ClockIcon} 
          color="border-indigo-500" 
          isLoading={isLoadingAppointments}
          description={nextAppointment ? `with ${nextAppointment.patient_first_name} ${nextAppointment.patient_last_name}` : "Your schedule is clear next."}
        />
         <StatCard 
          title="Pending Tasks" 
          value="N/A" 
          icon={ClipboardDocumentListIcon}
          color="border-amber-500" 
          isLoading={false} 
          description="Lab results, follow-ups"
        />
      </section>

      {/* Today's Appointments List */}
      <section className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-5">
            {/* CORRECTED LINE BELOW */}
            <h2 className="text-xl font-semibold text-slate-700">Today's Schedule ({format(new Date(), 'PPP')})</h2>
            <Link 
                to="/doctor/my-schedule"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                View Full Schedule &rarr;
            </Link>
        </div>

        {isLoadingAppointments ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
            <p className="text-slate-500 mt-3">Loading your appointments...</p>
          </div>
        ) : appointmentsError ? (
            <div className="text-center py-10 px-4 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto" />
                <p className="text-red-700 mt-3 font-medium">Could not load your appointments.</p>
                <p className="text-sm text-red-600">{appointmentsError.message}</p>
            </div>
        ) : todaysAppointments && todaysAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {['Time', 'Patient', 'Reason', 'Status', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {todaysAppointments.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-sky-700">
                      {appt.appointment_datetime ? format(parseISO(appt.appointment_datetime), 'p') : 'N/A'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {appt.patient_first_name} {appt.patient_last_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-sm truncate" title={appt.reason}>
                      {appt.reason || 'N/A'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClasses(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/patients/${appt.patient_id}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                        title="View Patient Record"
                      >
                        <EyeIcon className="h-5 w-5 inline-block" />
                      </Link>
                      {appt.status === 'Checked-In' && (
                        <button
                          onClick={() => handleStartConsultation(appt.appointment_id)}
                          disabled={updateAppointmentStatusMutation.isLoading && updateAppointmentStatusMutation.variables?.appointmentId === appt.appointment_id}
                          className="text-teal-600 hover:text-teal-900 p-1.5 rounded-md hover:bg-teal-100 transition-colors disabled:opacity-50"
                          title="Start Consultation"
                        >
                          <VideoCameraIcon className="h-5 w-5 inline-block" />
                        </button>
                      )}
                       {(appt.status === 'Checked-In' || appt.status === 'In Progress') && (
                        <button
                          onClick={() => handleCompleteConsultation(appt.appointment_id, appt.patient_id)}
                           disabled={updateAppointmentStatusMutation.isLoading && updateAppointmentStatusMutation.variables?.appointmentId === appt.appointment_id}
                          className="text-green-600 hover:text-green-900 p-1.5 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Complete & Log Treatment"
                        >
                          <CheckCircleSolidIcon className="h-5 w-5 inline-block" />
                        </button>
                      )}
                       <Link
                        to={`/treatments/new?patientId=${appt.patient_id}&appointmentId=${appt.appointment_id}`}
                        className="text-purple-600 hover:text-purple-900 p-1.5 rounded-md hover:bg-purple-100 transition-colors"
                        title="Log Treatment/Notes"
                      >
                        <PencilSquareIcon className="h-5 w-5 inline-block" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <CalendarDaysIcon className="h-16 w-16 text-slate-400 mx-auto" />
            <p className="text-slate-600 mt-4 font-medium">No appointments scheduled or checked-in for today.</p>
            <p className="text-sm text-slate-500">Your schedule is clear!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DoctorDashboardPage;
