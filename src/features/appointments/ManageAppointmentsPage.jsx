import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PencilSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ChevronUpDownIcon,
  PrinterIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isValid } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react'; // For Modals

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable SelectField for filters (simplified for this context)
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

const ManageAppointmentsPage = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    dateFrom: null,
    dateTo: null,
    doctorId: '',
    status: '',
    patientSearch: '' // For searching by patient name or ID
  });

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const { control: rescheduleControl, handleSubmit: handleRescheduleSubmit, reset: resetRescheduleForm, formState: { errors: rescheduleErrors, isSubmitting: isRescheduling } } = useForm();
  const { control: statusControl, handleSubmit: handleStatusSubmit, reset: resetStatusForm, setValue: setStatusValue, formState: { errors: statusErrors, isSubmitting: isUpdatingStatus } } = useForm();


  // Fetch active doctors for filter dropdown
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['activeDoctorsList'],
    queryFn: async () => {
      if (!token) return [];
      const response = await axios.get(`${API_BASE_URL}/doctor?is_active=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(d => ({ value: d.doctor_id, label: `Dr. ${d.first_name} ${d.last_name}` }));
    },
    enabled: !!token,
  });

  // Fetch appointments based on filters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', format(new Date(filters.dateFrom), 'yyyy-MM-dd'));
    if (filters.dateTo) params.append('dateTo', format(new Date(filters.dateTo), 'yyyy-MM-dd'));
    if (filters.doctorId) params.append('doctorId', filters.doctorId);
    if (filters.status) params.append('status', filters.status);
    if (filters.patientSearch) params.append('patientSearch', filters.patientSearch); // Backend needs to support this
    return params.toString();
  }, [filters]);

  const { data: appointmentsData, isLoading: isLoadingAppointments, error: appointmentsError, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments', queryParams],
    queryFn: async () => {
      if (!token) return [];
      const response = await axios.get(`${API_BASE_URL}/appointment?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!token,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (appointmentsError) toast.error(`Error fetching appointments: ${appointmentsError.message}`);
  }, [appointmentsError]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };
  
  const clearFilters = () => {
    setFilters({ dateFrom: null, dateTo: null, doctorId: '', status: '', patientSearch: '' });
    // refetchAppointments will be triggered by queryParams change
  };

  // --- Reschedule Modal Logic ---
  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    resetRescheduleForm({
      appointment_datetime: appointment.appointment_datetime ? new Date(appointment.appointment_datetime) : null,
    });
    setIsRescheduleModalOpen(true);
  };

  const onRescheduleSubmit = async (data) => {
    if (!selectedAppointment) return;
    const loadingToast = toast.loading('Rescheduling appointment...');
    try {
      const newDateTime = data.appointment_datetime ? format(new Date(data.appointment_datetime), "yyyy-MM-dd'T'HH:mm:ss") : null;
      await axios.put(`${API_BASE_URL}/appointment/${selectedAppointment.appointment_id}/reschedule`, 
        { newDateTime },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.dismiss(loadingToast);
      toast.success('Appointment rescheduled successfully!');
      setIsRescheduleModalOpen(false);
      queryClient.invalidateQueries(['appointments', queryParams]); // Refetch appointments list
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to reschedule.');
    }
  };

  // --- Update Status Modal Logic ---
  const appointmentStatuses = ['Scheduled', 'Checked-In', 'Completed', 'Cancelled', 'No Show'];
  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setStatusValue('status', appointment.status); // Set initial value for the select
    setIsStatusModalOpen(true);
  };

  const onStatusSubmit = async (data) => {
    if (!selectedAppointment) return;
    const loadingToast = toast.loading('Updating status...');
    try {
      await axios.put(`${API_BASE_URL}/appointment/${selectedAppointment.appointment_id}/status`, 
        { status: data.status },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.dismiss(loadingToast);
      toast.success('Appointment status updated!');
      setIsStatusModalOpen(false);
      queryClient.invalidateQueries(['appointments', queryParams]); // Refetch
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to update status.');
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Checked-In': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'No Show': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Manage Appointments</h1>
        <Link
          to="/appointments/schedule"
          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
        >
          <CalendarDaysIcon className="h-5 w-5 mr-2" />
          Schedule New
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
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
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
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
            />
          </div>
          <FilterSelectField
            label="Doctor"
            name="doctorId"
            value={filters.doctorId}
            onChange={handleFilterChange}
            options={doctorsData || []}
            placeholder="All Doctors"
            
            isLoading={isLoadingDoctors}
          />
          <FilterSelectField
            label="Status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            options={appointmentStatuses.map(s => ({ value: s, label: s }))}
            placeholder="All Statuses"
            Icon={AdjustmentsHorizontalIcon}
          />
          <div className="flex items-end space-x-2">
            <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors"
            >
                Clear
            </button>
            {/* Apply filters button is implicit via state change, or add one if preferred */}
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoadingAppointments ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-slate-600 mt-4">Loading appointments...</p>
            </div>
          ) : appointmentsData && appointmentsData.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Date & Time', 'Patient', 'Doctor', 'Reason', 'Status', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {appt.patient_first_name} {appt.patient_last_name}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">
                      Dr. {appt.doctor_first_name} {appt.doctor_last_name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xs truncate" title={appt.reason}>
                      {appt.reason || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openStatusModal(appt)}
                        className="text-yellow-600 hover:text-yellow-800 transition-colors p-1 rounded-md hover:bg-yellow-100"
                        title="Update Status"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openRescheduleModal(appt)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-md hover:bg-blue-100"
                        title="Reschedule"
                      >
                        <ClockIcon className="h-5 w-5" />
                      </button>
                       <Link to={`/appointments/${appt.appointment_id}`} className="text-teal-600 hover:text-teal-800 transition-colors p-1 rounded-md hover:bg-teal-100" title="View Details">
                           {/* Placeholder for a view details icon or text */}
                           <MagnifyingGlassIcon className="h-5 w-5" />
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
              <p className="text-sm text-slate-500">Try adjusting your filters or schedule a new appointment.</p>
            </div>
          )}
        </div>
        {/* TODO: Add Pagination component here if dealing with many appointments */}
      </div>

      {/* Reschedule Modal */}
      <Transition appear show={isRescheduleModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setIsRescheduleModalOpen(false)}>
          {/* Overlay */}
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-slate-800 mb-4">
                    Reschedule Appointment
                  </Dialog.Title>
                  <form onSubmit={handleRescheduleSubmit(onRescheduleSubmit)} className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Rescheduling for: <span className="font-medium">{selectedAppointment?.patient_first_name} {selectedAppointment?.patient_last_name}</span><br/>
                      With: <span className="font-medium">Dr. {selectedAppointment?.doctor_first_name} {selectedAppointment?.doctor_last_name}</span>
                    </p>
                    <DateTimePickerField
                        label="New Appointment Date & Time"
                        name="appointment_datetime"
                        control={rescheduleControl}
                        errors={rescheduleErrors}
                        required
                        disabled={isRescheduling}
                    />
                    <div className="mt-6 flex justify-end space-x-3">
                      <button type="button" onClick={() => setIsRescheduleModalOpen(false)} disabled={isRescheduling} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Cancel</button>
                      <button type="submit" disabled={isRescheduling} className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:bg-indigo-300">
                        {isRescheduling ? 'Saving...' : 'Reschedule'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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
                                <SelectField
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

export default ManageAppointmentsPage;
