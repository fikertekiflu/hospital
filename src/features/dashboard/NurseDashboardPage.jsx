import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import axios from 'axios';
import { format, parseISO, isToday } from 'date-fns';
import {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon as CheckCircleOutlineIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon, // For starting a task
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserCircleIcon as UserIcon, // For patient icon
  MagnifyingGlassIcon, // <<< ADDED IMPORT HERE
  PencilSquareIcon // Added for "Log General Note"
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable StatCard component (can be moved to common components)
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

// Reusable ActionCard component (can be moved to common components)
const ActionCard = ({ title, description, href, icon: Icon, bgColor, hoverBgColor, textColor = "text-white", iconColor }) => (
  <Link 
    to={href} 
    className={`block p-6 ${bgColor} ${hoverBgColor} ${textColor} rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
  >
    <Icon className={`h-10 w-10 mb-3 ${iconColor || textColor}`} />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className={`text-sm ${textColor} opacity-80 mt-1`}>{description}</p>
  </Link>
);


const NurseDashboardPage = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const nurseId = currentUser?.linkedStaffId; // Assuming linkedStaffId in SystemUser is the nurse_id

  // Fetch active tasks for the logged-in nurse
  const fetchMyActiveAssignments = async () => {
    if (!token || !nurseId) return [];
    // This API endpoint should be specifically for the logged-in user's tasks
    const response = await axios.get(`${API_BASE_URL}/assignment/my-tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Sort by start datetime, then by status (Pending before In Progress)
    return response.data.sort((a, b) => {
        const dateComparison = new Date(a.assignment_start_datetime) - new Date(b.assignment_start_datetime);
        if (dateComparison !== 0) return dateComparison;
        if (a.status === 'Pending' && b.status === 'In Progress') return -1;
        if (a.status === 'In Progress' && b.status === 'Pending') return 1;
        return 0;
    });
  };

  const { 
    data: activeAssignments, 
    isLoading: isLoadingAssignments, 
    error: assignmentsError,
  } = useQuery({
    queryKey: ['myActiveAssignments', nurseId],
    queryFn: fetchMyActiveAssignments,
    enabled: !!token && !!nurseId,
    refetchInterval: 30000, // Refetch tasks every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation for updating assignment status
  const updateAssignmentStatusMutation = useMutation({
    mutationFn: ({ assignmentId, status, endTime = null }) => {
        const payload = { status };
        if (endTime) payload.end_datetime = endTime; // Only include if provided
        return axios.put(`${API_BASE_URL}/assignment/${assignmentId}/status`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
    },
    onSuccess: (data, variables) => {
      toast.success(`Task status updated to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['myActiveAssignments', nurseId] });
    },
    onError: (error, variables) => {
      toast.error(error.response?.data?.message || `Failed to update task ${variables.assignmentId} status.`);
    }
  });

  useEffect(() => {
    if (assignmentsError) {
      toast.error(`Tasks: ${assignmentsError.message || 'Could not load your tasks.'}`);
    }
  }, [assignmentsError]);

  const handleStartTask = (assignmentId) => {
    updateAssignmentStatusMutation.mutate({ assignmentId, status: 'In Progress' });
  };
  
  const handleCompleteTask = (assignmentId) => {
    // Set end time to now when completing
    const endTime = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    updateAssignmentStatusMutation.mutate({ assignmentId, status: 'Completed', endTime });
  };

  const getStatusPillClasses = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'In Progress': return 'bg-sky-100 text-sky-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  if (!currentUser?.isLoading && !nurseId && currentUser?.role === 'Nurse') { 
    return (
        <div className="p-6 sm:p-8 bg-white rounded-lg shadow-xl max-w-lg mx-auto mt-10 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Profile Not Linked</h2>
            <p className="mt-2 text-slate-600">
                Your system user account is not yet linked to a Nurse's professional profile. 
                This is required to access your dashboard and tasks.
            </p>
            <p className="mt-2 text-slate-600">
                Please contact an administrator to set up or link your professional profile.
            </p>
        </div>
    );
  }

  const tasksToday = activeAssignments?.filter(task => isToday(parseISO(task.assignment_start_datetime))) || [];
  const upcomingTasks = activeAssignments?.filter(task => !isToday(parseISO(task.assignment_start_datetime))) || [];


  return (
    <div className="space-y-8 p-1 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Nurse Dashboard</h1>
        <p className="mt-2 text-lg text-slate-600">
          Welcome, Nurse {currentUser?.full_name || currentUser?.username}! Here are your current responsibilities.
        </p>
      </header>

      {/* Quick Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Active Tasks Today" 
          value={tasksToday.length} 
          icon={ClipboardDocumentListIcon} 
          color="border-teal-500" 
          isLoading={isLoadingAssignments}
          description="Pending or In Progress"
        />
        <StatCard 
          title="Upcoming Tasks" 
          value={upcomingTasks.length} 
          icon={ClockIcon} 
          color="border-sky-500" 
          isLoading={isLoadingAssignments}
          description="Scheduled for later"
        />
         <StatCard 
          title="Patients Assigned" 
          value={activeAssignments ? new Set(activeAssignments.map(a => a.patient_id)).size : 0} 
          icon={UserGroupIcon} 
          color="border-emerald-500" 
          isLoading={isLoadingAssignments} 
          description="Across all active tasks"
        />
      </section>

      {/* Quick Actions Section */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard title="View Full Task List" description="See all your pending and in-progress tasks." href="/assignments/my-tasks" icon={ClipboardDocumentListIcon} bgColor="bg-teal-600" hoverBgColor="hover:bg-teal-700" iconColor="text-teal-200" />
          <ActionCard title="Patient Lookup" description="Search for patient records." href="/patients" icon={MagnifyingGlassIcon} bgColor="bg-sky-600" hoverBgColor="hover:bg-sky-700" iconColor="text-sky-200" />
          <ActionCard title="Log General Note" description="Record observations or shift notes." href="/nurses/notes/new" icon={PencilSquareIcon} bgColor="bg-purple-600" hoverBgColor="hover:bg-purple-700" iconColor="text-purple-200" />
        </div>
      </section>


      {/* Today's Active Tasks List */}
      <section className="bg-white p-4 sm:p-6 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-slate-700">Today's Active Tasks ({format(new Date(), 'MMMM d, yyyy')})</h2>
            <Link 
                to="/assignments/my-tasks"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                View All My Tasks &rarr;
            </Link>
        </div>

        {isLoadingAssignments ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-slate-500 mt-3">Loading your tasks...</p>
          </div>
        ) : assignmentsError ? (
            <div className="text-center py-10 px-4 bg-red-50 rounded-lg">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto" />
                <p className="text-red-700 mt-3 font-medium">Could not load your tasks.</p>
                <p className="text-sm text-red-600">{assignmentsError.message}</p>
            </div>
        ) : tasksToday && tasksToday.length > 0 ? (
          <div className="space-y-4">
            {tasksToday.map((task) => (
              <div key={task.assignment_id} className="p-4 bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">
                        <UserIcon className="h-4 w-4 inline-block mr-1.5 align-text-bottom text-indigo-500"/>
                        {task.patient_first_name} {task.patient_last_name} 
                        {task.admission_id && <span className="text-xs text-slate-500 ml-1">(Room: {task.room_number || 'N/A'})</span>}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                        <ClockIcon className="h-3.5 w-3.5 inline-block mr-1 align-text-bottom text-slate-400"/>
                        Scheduled: {task.assignment_start_datetime ? format(parseISO(task.assignment_start_datetime), 'p') : 'N/A'}
                        {task.assignment_end_datetime && <span> - {format(parseISO(task.assignment_end_datetime), 'p')}</span>}
                    </p>
                  </div>
                  <span className={`mt-2 sm:mt-0 px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClasses(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-slate-800 mt-2 font-medium">{task.task_description}</p>
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2 items-center justify-end">
                    <Link
                        to={`/patients/${task.patient_id}`}
                        className="text-xs inline-flex items-center px-2.5 py-1 border border-transparent rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                        title="View Patient Record"
                    >
                        <EyeIcon className="h-4 w-4 mr-1.5" /> View Patient
                    </Link>
                    {task.status === 'Pending' && (
                        <button
                            onClick={() => handleStartTask(task.assignment_id)}
                            disabled={updateAssignmentStatusMutation.isLoading && updateAssignmentStatusMutation.variables?.assignmentId === task.assignment_id}
                            className="text-xs inline-flex items-center px-2.5 py-1 border border-transparent rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-70 transition-colors"
                            title="Start Task"
                        >
                            <PlayIcon className="h-4 w-4 mr-1.5" /> Start Task
                        </button>
                    )}
                    {task.status === 'In Progress' && (
                        <button
                            onClick={() => handleCompleteTask(task.assignment_id)}
                            disabled={updateAssignmentStatusMutation.isLoading && updateAssignmentStatusMutation.variables?.assignmentId === task.assignment_id}
                            className="text-xs inline-flex items-center px-2.5 py-1 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-70 transition-colors"
                            title="Mark as Completed"
                        >
                           <CheckCircleSolidIcon className="h-4 w-4 mr-1.5" /> Complete Task
                        </button>
                    )}
                     <button
                        onClick={() => navigate(`/assignments/${task.assignment_id}/notes`)} // Placeholder
                        className="text-xs inline-flex items-center px-2.5 py-1 border border-transparent rounded-md shadow-sm text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors"
                        title="Add/View Notes"
                    >
                        <PencilSquareIcon className="h-4 w-4 mr-1.5" /> Notes
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ClipboardDocumentListIcon className="h-16 w-16 text-slate-400 mx-auto" />
            <p className="text-slate-600 mt-4 font-medium">No active tasks assigned for today.</p>
            <p className="text-sm text-slate-500">Your task list is clear!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NurseDashboardPage;
