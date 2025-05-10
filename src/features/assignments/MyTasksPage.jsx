import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import toast from 'react-hot-toast';
import { format, parseISO, isToday } from 'date-fns';
import {
  ClipboardDocumentListIcon,
  UserIcon as PatientIcon,
  ClockIcon,
  EyeIcon,
  PlayIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  PencilSquareIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
// No modals are strictly needed on this page for basic functionality,
// but could be added for "Add Notes" or complex "Complete Task" actions.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable FilterSelectField (can be moved to common components)
const FilterSelectField = ({ label, name, value, onChange, options, placeholder, Icon, isLoading, disabled }) => (
  <div>
    <label htmlFor={name} className="block text-xs font-medium text-slate-600 sr-only">{label}</label>
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled || isLoading}
        className={`block w-full py-2 ${Icon ? 'pl-9 pr-8' : 'pl-3 pr-8'} border border-slate-300 
                    rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 
                    text-sm text-slate-700 appearance-none transition-colors duration-150 ease-in-out disabled:bg-slate-100
                    ${isLoading ? 'animate-pulse bg-slate-200' : 'bg-white'}`}
      >
        <option value="">{isLoading ? `Loading ${label.toLowerCase()}...` : placeholder || `All ${label}`}</option>
        {!isLoading && options?.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {!isLoading && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <ChevronUpDownIcon className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
    </div>
  </div>
);


const MyTasksPage = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const staffId = currentUser?.linkedStaffId; // This will be nurse_id or ward_boy_id
  const staffRole = currentUser?.role; // 'Nurse' or 'WardBoy'

  const [statusFilter, setStatusFilter] = useState(''); // 'Pending', 'In Progress', 'Completed' (for today/recent)

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    // Add other filters like date if your backend /my-tasks supports it
    return params.toString();
  }, [statusFilter]);

  const {
    data: assignments,
    isLoading: isLoadingAssignments,
    error: assignmentsError,
  } = useQuery({
    queryKey: ['myAssignments', staffId, queryParams], // Include staffId and filters in queryKey
    queryFn: async () => {
      if (!token || !staffId) return [];
      // The backend /my-tasks should filter by the logged-in user's staffId (from JWT)
      // and can optionally accept further filters like status from queryParams
      const response = await axios.get(`${API_BASE_URL}/assignment/my-tasks?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      // Sort by start datetime, then by status (Pending before In Progress)
      return response.data.sort((a, b) => {
        const dateComparison = new Date(a.assignment_start_datetime) - new Date(b.assignment_start_datetime);
        if (dateComparison !== 0) return dateComparison;
        if (a.status === 'Pending' && b.status === 'In Progress') return -1;
        if (a.status === 'In Progress' && b.status === 'Pending') return 1;
        return 0;
      });
    },
    enabled: !!token && !!staffId && (staffRole === 'Nurse' || staffRole === 'WardBoy'),
    refetchInterval: 30000, // Refetch tasks every 30 seconds
  });

  const updateAssignmentStatusMutation = useMutation({
    mutationFn: ({ assignmentId, status, endTime = null }) => {
        const payload = { status };
        if (endTime) payload.end_datetime = endTime;
        return axios.put(`${API_BASE_URL}/assignment/${assignmentId}/status`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },
    onSuccess: (data, variables) => {
      toast.success(`Task status updated to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['myAssignments', staffId, queryParams] });
      // If dashboard shows a count of these, invalidate that too
      queryClient.invalidateQueries({ queryKey: ['myActiveAssignments', staffId] }); 
    },
    onError: (error, variables) => {
      toast.error(error.response?.data?.message || `Failed to update task ${variables.assignmentId} status.`);
    }
  });

  useEffect(() => {
    if (assignmentsError) {
      toast.error(`My Tasks: ${assignmentsError.message || 'Could not load tasks.'}`);
    }
  }, [assignmentsError]);

  const handleStartTask = (assignmentId) => {
    updateAssignmentStatusMutation.mutate({ assignmentId, status: 'In Progress' });
  };
  
  const handleCompleteTask = (assignmentId) => {
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

  if (!currentUser?.isLoading && !staffId && (staffRole === 'Nurse' || staffRole === 'WardBoy')) { 
    return (
        <div className="p-6 sm:p-8 bg-white rounded-lg shadow-xl max-w-lg mx-auto mt-10 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Profile Not Linked</h2>
            <p className="mt-2 text-slate-600">
                Your system user account is not linked to a {staffRole} profile. 
                This is required to view your tasks.
            </p>
            <p className="mt-2 text-slate-600">
                Please contact an administrator to set up or link your professional profile.
            </p>
        </div>
    );
  }
  
  const assignmentStatusOptions = [
    { value: '', label: 'All Active (Pending/In Progress)' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed (Recent)' }, // Backend might need date filter for "recent"
  ];


  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <ClipboardDocumentListIcon className="h-10 w-10 text-teal-600 mr-3" />
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Active Tasks</h1>
        </div>
        {/* Add New Assignment button could go here if nurses/wardboys can create tasks for themselves or others */}
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <FilterSelectField
                label="Task Status"
                name="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={assignmentStatusOptions}
                placeholder="Filter by status..."
                Icon={AdjustmentsHorizontalIcon}
                disabled={isLoadingAssignments}
            />
            {/* Add Date Filter if needed */}
            {/* Add Patient Search Filter if needed */}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoadingAssignments ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading your tasks...</p>
            </div>
          ) : assignmentsError ? (
            <div className="text-center py-20 px-4 bg-red-50 rounded-lg m-4">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto" />
                <p className="text-red-700 mt-3 font-medium">Could not load your tasks.</p>
                <p className="text-sm text-red-600">{assignmentsError.message}</p>
            </div>
          ) : assignments && assignments.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {['Time', 'Patient', 'Room', 'Task Description', 'Status', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {assignments.map((task) => (
                  <tr key={task.assignment_id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                      {task.assignment_start_datetime ? format(parseISO(task.assignment_start_datetime), 'p') : 'N/A'}
                      {task.assignment_end_datetime && <span className="block text-xs text-slate-500">End: {format(parseISO(task.assignment_end_datetime), 'p')}</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {task.patient_first_name} {task.patient_last_name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                      {task.room_number || 'N/A'} {/* Assumes room_number is joined in backend */}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-md" title={task.task_description}>
                        <p className="truncate_custom">{task.task_description}</p> {/* Custom class for better truncation if needed */}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusPillClasses(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/patients/${task.patient_id}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                        title="View Patient Record"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      {task.status === 'Pending' && (
                        <button
                          onClick={() => handleStartTask(task.assignment_id)}
                          disabled={updateAssignmentStatusMutation.isLoading && updateAssignmentStatusMutation.variables?.assignmentId === task.assignment_id}
                          className="text-sky-600 hover:text-sky-900 p-1.5 rounded-md hover:bg-sky-100 transition-colors disabled:opacity-50"
                          title="Start Task"
                        >
                          <PlayIcon className="h-5 w-5" />
                        </button>
                      )}
                      {task.status === 'In Progress' && (
                        <button
                          onClick={() => handleCompleteTask(task.assignment_id)}
                          disabled={updateAssignmentStatusMutation.isLoading && updateAssignmentStatusMutation.variables?.assignmentId === task.assignment_id}
                          className="text-green-600 hover:text-green-900 p-1.5 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
                          title="Mark as Completed"
                        >
                          <CheckCircleSolidIcon className="h-5 w-5" />
                        </button>
                      )}
                       <button
                        onClick={() => navigate(`/assignments/${task.assignment_id}/notes`)} // Placeholder
                        className="text-purple-600 hover:text-purple-900 p-1.5 rounded-md hover:bg-purple-100 transition-colors"
                        title="Add/View Notes"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20">
              <FunnelIcon className="h-16 w-16 text-slate-400 mx-auto" />
              <p className="text-slate-600 mt-4">No tasks found matching your criteria.</p>
              <p className="text-sm text-slate-500">Your task list is clear for now!</p>
            </div>
          )}
        </div>
        {/* TODO: Implement Pagination if many tasks */}
      </div>
    </div>
  );
};

export default MyTasksPage;
