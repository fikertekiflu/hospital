import React, { useState, useEffect, useMemo, Fragment } from 'react'; // <<< ADDED Fragment HERE
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PencilSquareIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, isValid } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react'; 
import { useForm, Controller } from 'react-hook-form'; 

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

// Reusable ModalSelectField (can be moved to common components)
const ModalSelectField = ({ label, name, control, errors, required = false, options, placeholder, disabled }) => (
  <div className="relative">
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Controller
      name={name}
      control={control}
      rules={{ required: required ? `${label} is required.` : false }}
      render={({ field }) => (
        <select
          {...field}
          id={name}
          disabled={disabled}
          className={`block w-full py-2.5 px-3 border ${errors[name] ? 'border-red-400' : 'border-slate-300'} 
                      rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                      text-sm text-slate-900 placeholder-slate-400 appearance-none transition-all duration-150 ease-in-out disabled:bg-slate-100`}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}...`}</option>
          {options?.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      )}
    />
     {!disabled && (
        <div className="pointer-events-none absolute inset-y-0 right-0 top-7 flex items-center px-3 text-gray-500">
          <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    {errors[name] && <p className="mt-1.5 text-xs text-red-600">{errors[name].message}</p>}
  </div>
);


const MySchedulePage = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const doctorId = currentUser?.linkedStaffId;

  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    status: '',
  });

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const { control: statusControl, handleSubmit: handleStatusSubmit, reset: resetStatusForm, setValue: setStatusValue, formState: { errors: statusErrors, isSubmitting: isUpdatingStatus } } = useForm();

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (!doctorId) return ''; 
    
    if (filters.dateFrom && isValid(new Date(filters.dateFrom))) params.append('dateFrom', format(new Date(filters.dateFrom), 'yyyy-MM-dd'));
    if (filters.dateTo && isValid(new Date(filters.dateTo))) params.append('dateTo', format(new Date(filters.dateTo), 'yyyy-MM-dd'));
    if (filters.status) params.append('status', filters.status);
    return params.toString();
  }, [filters, doctorId]);

  const {
    data: appointmentsData,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useQuery({
    queryKey: ['doctorAppointments', doctorId, queryParams],
    queryFn: async () => {
      if (!token || !doctorId) return [];
      const response = await axios.get(`${API_BASE_URL}/appointment/doctor/${doctorId}?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token && !!doctorId, 
    keepPreviousData: true,
  });

  useEffect(() => {
    if (appointmentsError) {
      toast.error(`Error fetching appointments: ${appointmentsError.message}`);
    }
  }, [appointmentsError]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };
  
  const clearFilters = () => {
    setFilters({ dateFrom: null, dateTo: null, status: '' });
  };

  const appointmentStatuses = ['Scheduled', 'Checked-In', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setStatusValue('status', appointment.status);
    setIsStatusModalOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ appointmentId, status }) => axios.put(`${API_BASE_URL}/appointments/${appointmentId}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
    onSuccess: (data, variables) => {
      toast.success(`Appointment status updated to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments', doctorId, queryParams] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointmentsForDoctor', doctorId] }); 
      setIsStatusModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  });

  const onStatusSubmit = (data) => {
    if (!selectedAppointment) return;
    updateStatusMutation.mutate({ appointmentId: selectedAppointment.appointment_id, status: data.status });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Checked-In': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-teal-100 text-teal-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!currentUser?.isLoading && !doctorId) { 
    return (
        <div className="p-6 sm:p-8 bg-white rounded-lg shadow-xl max-w-lg mx-auto mt-10 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700">Profile Not Linked</h2>
            <p className="mt-2 text-slate-600">
                Your system user account is not linked to a Doctor profile. 
                Please contact an administrator.
            </p>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex items-center">
        <CalendarDaysIcon className="h-10 w-10 text-sky-600 mr-3" />
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Schedule</h1>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="dateFromFilter" className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <DatePicker
              selected={filters.dateFrom ? new Date(filters.dateFrom) : null}
              onChange={(date) => handleDateChange('dateFrom', date)}
              selectsStart
              startDate={filters.dateFrom ? new Date(filters.dateFrom) : null}
              endDate={filters.dateTo ? new Date(filters.dateTo) : null}
              dateFormat="MM/dd/yyyy"
              className="block w-full py-2 px-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholderText="Start Date"
              isClearable
              id="dateFromFilter"
            />
          </div>
          <div>
            <label htmlFor="dateToFilter" className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <DatePicker
              selected={filters.dateTo ? new Date(filters.dateTo) : null}
              onChange={(date) => handleDateChange('dateTo', date)}
              selectsEnd
              startDate={filters.dateFrom ? new Date(filters.dateFrom) : null}
              endDate={filters.dateTo ? new Date(filters.dateTo) : null}
              minDate={filters.dateFrom ? new Date(filters.dateFrom) : null}
              dateFormat="MM/dd/yyyy"
              className="block w-full py-2 px-3 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholderText="End Date"
              isClearable
              id="dateToFilter"
            />
          </div>
          <FilterSelectField
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={appointmentStatuses.map(s => ({ value: s, label: s }))}
            placeholder="All Statuses"
            Icon={AdjustmentsHorizontalIcon}
          />
          <div className="flex items-end">
            <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors"
            >
                Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoadingAppointments ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500 mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading your schedule...</p>
            </div>
          ) : appointmentsError ? (
            <div className="text-center py-20 px-4 bg-red-50 rounded-lg m-4">
                <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto" />
                <p className="text-red-700 mt-3 font-medium">Could not load your schedule.</p>
                <p className="text-sm text-red-600">{appointmentsError.message}</p>
            </div>
          ) : appointmentsData && appointmentsData.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {['Date & Time', 'Patient', 'Reason', 'Status', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {appointmentsData.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                      {appt.appointment_datetime ? format(parseISO(appt.appointment_datetime), 'MMM d, yyyy p') : 'N/A'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {appt.patient_first_name} {appt.patient_last_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-sm truncate" title={appt.reason}>
                      {appt.reason || 'N/A'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/patients/${appt.patient_id}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 rounded-md hover:bg-indigo-100 transition-colors"
                        title="View Patient Record"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>
                      {['Scheduled', 'Checked-In', 'In Progress'].includes(appt.status) && (
                        <button
                            onClick={() => openStatusModal(appt)}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors p-1.5 rounded-md hover:bg-yellow-100"
                            title="Update Status"
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                        </button>
                      )}
                       <Link
                        to={`/treatments/new?patientId=${appt.patient_id}&appointmentId=${appt.appointment_id}`}
                        className="text-purple-600 hover:text-purple-900 p-1.5 rounded-md hover:bg-purple-100 transition-colors"
                        title="Log Treatment/Notes"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20">
              <FunnelIcon className="h-16 w-16 text-slate-400 mx-auto" />
              <p className="text-slate-600 mt-4">No appointments found matching your criteria.</p>
              <p className="text-sm text-slate-500">Try adjusting your filters.</p>
            </div>
          )}
        </div>
        {/* TODO: Implement Pagination if needed */}
      </div>

      {/* Update Status Modal */}
      <Transition appear show={isStatusModalOpen} as={Fragment}>
         <Dialog as="div" className="relative z-30" onClose={() => setIsStatusModalOpen(false)}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-slate-800 mb-4">
                                Update Appointment Status
                            </Dialog.Title>
                            <form onSubmit={handleStatusSubmit(onStatusSubmit)} className="space-y-4">
                                <p className="text-sm text-slate-600">
                                  Patient: <span className="font-medium">{selectedAppointment?.patient_first_name} {selectedAppointment?.patient_last_name}</span><br/>
                                  Current Status: <span className={`font-medium px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(selectedAppointment?.status || '')}`}>{selectedAppointment?.status}</span>
                                </p>
                                <ModalSelectField
                                    label="New Status"
                                    name="status"
                                    control={statusControl}
                                    errors={statusErrors}
                                    required
                                    options={appointmentStatuses.map(s => ({ value: s, label: s }))}
                                    placeholder="Select new status..."
                                    disabled={isUpdatingStatus}
                                />
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button type="button" onClick={() => setIsStatusModalOpen(false)} disabled={isUpdatingStatus} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Cancel</button>
                                    <button type="submit" disabled={isUpdatingStatus} className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:bg-indigo-300">
                                        {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                                    </button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default MySchedulePage;
