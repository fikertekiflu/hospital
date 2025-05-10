import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, Transition } from '@headlessui/react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  UsersIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  XMarkIcon as XMarkIconSolid,
  ExclamationTriangleIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, isValid } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Debounce function
function debounce(func, delay) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
}

// Reusable Form InputField for Modals
const ModalInputField = ({ label, name, type = "text", register, errors, required = false, placeholder, defaultValue, disabled }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      disabled={disabled}
      className={`block w-full px-3 py-2 border ${errors[name] ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} 
                  rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                  sm:text-sm transition-colors`}
      {...register(name, {
        required: required ? `${label} is required.` : false,
        ...(type === "number" && { valueAsNumber: true, min: { value: 0, message: `${label} must be non-negative` } }),
        ...(type === "email" && { pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" } }),
        ...(name === "phone_number" && { pattern: { value: /^[0-9\s+-]{9,15}$/, message: "Invalid phone number format." } }),
      })}
    />
    {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
  </div>
);

// Reusable ModalSelectField for Modals
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


const PatientListPage = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null); // null for Add, patient object for Edit

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting: isFormSubmitting } } = useForm({
    mode: "onTouched",
    defaultValues: { // Default values for the form
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        phone_number: '',
        email: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        is_active: true // Default new patients to active
    }
  });

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const debouncedSetSearch = useMemo(() => debounce(setDebouncedSearchTerm, 500), []);

  useEffect(() => {
    debouncedSetSearch(searchTerm);
  }, [searchTerm, debouncedSetSearch]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
    // Add other filters like status if needed:
    // if (filters.status) params.append('status', filters.status);
    return params.toString();
  }, [debouncedSearchTerm]);

  const {
    data: patientsData,
    isLoading: isLoadingPatients,
    error: patientsError,
    isFetching: isFetchingPatients, // For subtle loading indicator during refetch
  } = useQuery({
    queryKey: ['patients', queryParams], 
    queryFn: async () => {
      if (!token) return [];
      const response = await axios.get(`${API_BASE_URL}/patient?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!token,
    keepPreviousData: true, // Good UX for filtering/searching
  });

  useEffect(() => {
    if (patientsError) {
      toast.error(`Error fetching patients: ${patientsError.response?.data?.message || patientsError.message}`);
    }
  }, [patientsError]);

  // --- Mutations for CRUD ---
  const createPatientMutation = useMutation({
    mutationFn: (newPatientData) => axios.post(`${API_BASE_URL}/patient`, newPatientData, {
        headers: { 'Authorization': `Bearer ${token}` }
    }),
    onSuccess: () => {
        toast.success('Patient registered successfully!');
        queryClient.invalidateQueries({ queryKey: ['patients', queryParams] });
        setIsAddEditModalOpen(false);
        reset(); // Reset form to default values
    },
    onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to register patient.');
    }
  });

  const updatePatientMutation = useMutation({
    mutationFn: ({ patientId, updatedData }) => axios.put(`${API_BASE_URL}/patient/${patientId}`, updatedData, {
        headers: { 'Authorization': `Bearer ${token}` }
    }),
    onSuccess: () => {
        toast.success('Patient details updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['patients', queryParams] });
        setIsAddEditModalOpen(false);
        setEditingPatient(null);
        reset();
    },
    onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update patient details.');
    }
  });

  const deletePatientMutation = useMutation({
    mutationFn: (patientId) => axios.delete(`${API_BASE_URL}/patient/${patientId}`, { // Ensure backend supports DELETE
        headers: { 'Authorization': `Bearer ${token}` }
    }),
    onSuccess: () => {
        toast.success('Patient deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['patients', queryParams] });
        setIsDeleteModalOpen(false);
        setEditingPatient(null);
    },
    onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete patient. They might have linked records.');
        setIsDeleteModalOpen(false); // Close modal even on error
    }
  });

  // --- Modal and Form Handlers ---
  const openAddModal = () => {
    setEditingPatient(null);
    reset({ // Explicitly reset to ensure all fields are cleared or set to defaults
        first_name: '', last_name: '', date_of_birth: '', gender: '',
        phone_number: '', email: '', address: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        is_active: true // Default for new patient
    });
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    reset({ // Pre-fill form with existing patient data
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth ? format(parseISO(patient.date_of_birth), 'yyyy-MM-dd') : '',
        gender: patient.gender || '',
        phone_number: patient.phone_number,
        email: patient.email || '',
        address: patient.address || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        is_active: patient.is_active === undefined ? true : patient.is_active // Handle if is_active is not present
    });
    setIsAddEditModalOpen(true);
  };
  
  const openDeleteModal = (patient) => {
    setEditingPatient(patient);
    setIsDeleteModalOpen(true);
  };

  const onFormSubmit = (data) => {
    const patientData = {
      ...data,
      date_of_birth: data.date_of_birth ? format(new Date(data.date_of_birth), 'yyyy-MM-dd') : null,
      // Ensure optional fields are null if empty, not empty strings
      email: data.email || null,
      address: data.address || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      gender: data.gender || null,
      is_active: data.is_active // This will be true/false from the select
    };

    if (editingPatient) {
      updatePatientMutation.mutate({ patientId: editingPatient.patient_id, updatedData: patientData });
    } else {
      createPatientMutation.mutate(patientData);
    }
  };

  const confirmDeletePatient = () => {
    if (editingPatient) {
      deletePatientMutation.mutate(editingPatient.patient_id);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Determine if the current user can perform CUD operations on patients
  const canManagePatients = currentUser?.role === 'Admin' || currentUser?.role === 'Receptionist';

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <UsersIcon className="h-10 w-10 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Records</h1>
        </div>
        {canManagePatients && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Register New Patient
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-lg">
        <label htmlFor="patientSearch" className="sr-only">Search Patients</label>
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="patientSearch"
            id="patientSearch"
            className="block w-full py-2.5 pl-10 pr-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-slate-400"
            placeholder="Search by name, ID, phone, or email..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Patient List Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          {(isLoadingPatients || isFetchingPatients) && !patientsData ? (
            <div className="text-center py-20"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div><p className="text-slate-600 mt-4">Loading patients...</p></div>
          ) : patientsError ? (
            <div className="text-center py-20 px-4 bg-red-50 rounded-lg m-4"><ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto" /><p className="text-red-700 mt-3 font-medium">Could not load patient data.</p><p className="text-sm text-red-600">{patientsError.message}</p></div>
          ) : patientsData && patientsData.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  {['Patient ID', 'Full Name', 'DOB', 'Phone', 'Email', 'Status', 'Actions'].map(header => (
                    <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200 relative">
                {isFetchingPatients && patientsData && (<div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div></div>)}
                {patientsData.map((patient) => (
                  <tr key={patient.patient_id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-indigo-700">
                      PID-{String(patient.patient_id).padStart(4, '0')}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{patient.first_name} {patient.last_name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{patient.date_of_birth ? format(parseISO(patient.date_of_birth), 'MM/dd/yyyy') : 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{patient.phone_number}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-600">{patient.email || 'N/A'}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {patient.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/patients/${patient.patient_id}`} className="text-sky-600 hover:text-sky-800 p-1.5 rounded-md hover:bg-sky-100 transition-colors" title="View Details"><EyeIcon className="h-5 w-5 inline-block" /></Link>
                      {canManagePatients && (
                        <>
                          <button onClick={() => openEditModal(patient)} className="text-amber-600 hover:text-amber-800 p-1.5 rounded-md hover:bg-amber-100 transition-colors" title="Edit Patient"><PencilIcon className="h-5 w-5 inline-block" /></button>
                          <button onClick={() => openDeleteModal(patient)} className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-100 transition-colors" title="Delete Patient"><TrashIcon className="h-5 w-5 inline-block" /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20"><FunnelIcon className="h-16 w-16 text-slate-400 mx-auto" /><p className="text-slate-600 mt-4">No patients found.</p>{debouncedSearchTerm && <p className="text-sm text-slate-500">Try a different search term.</p>}</div>
          )}
        </div>
        {/* TODO: Implement Pagination component if results are many */}
      </div>

      {/* Add/Edit Patient Modal */}
      <Transition appear show={isAddEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsAddEditModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-slate-800 mb-6 flex items-center">
                    <UserPlusIcon className="h-7 w-7 text-indigo-600 mr-3"/>
                    {editingPatient ? 'Edit Patient Details' : 'Register New Patient'}
                  </Dialog.Title>
                  <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <ModalInputField label="First Name" name="first_name" register={register} errors={errors} required disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                      <ModalInputField label="Last Name" name="last_name" register={register} errors={errors} required disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                      <ModalInputField label="Date of Birth" name="date_of_birth" type="date" register={register} errors={errors} required disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                      <ModalSelectField label="Gender" name="gender" control={control} errors={errors} options={genderOptions} placeholder="Select Gender" disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                    </div>
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <ModalInputField label="Phone Number" name="phone_number" type="tel" register={register} errors={errors} required placeholder="e.g., 0911223344" disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                      <ModalInputField label="Email Address" name="email" type="email" register={register} errors={errors} placeholder="e.g., patient@example.com" disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea id="address" name="address" rows="3" {...register("address")} className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50" disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                      </div>
                    </div>
                    {/* Emergency Contact */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <ModalInputField label="Emergency Contact Name" name="emergency_contact_name" register={register} errors={errors} disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                        <ModalInputField label="Emergency Contact Phone" name="emergency_contact_phone" type="tel" register={register} errors={errors} disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}/>
                     </div>
                     {editingPatient && ( // Only show is_active for existing patients
                        <div>
                            <label htmlFor="is_active_modal" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select id="is_active_modal" {...register("is_active", {setValueAs: v => v === 'true'})}
                                className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50"
                                // defaultValue is handled by reset() in openEditModal
                                disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                     )}

                    <div className="mt-8 flex justify-end space-x-3 pt-5 border-t border-slate-200">
                      <button type="button" onClick={() => { setIsAddEditModalOpen(false); setEditingPatient(null); reset(); }} disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Cancel</button>
                      <button type="submit" disabled={isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                        {isFormSubmitting || createPatientMutation.isLoading || updatePatientMutation.isLoading ? 'Saving...' : (editingPatient ? 'Update Patient' : 'Register Patient')}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-slate-800 flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                    Confirm Deletion
                  </Dialog.Title>
                  <div className="mt-3">
                    <p className="text-sm text-slate-600">
                      Are you sure you want to delete patient <span className="font-medium">{editingPatient?.first_name} {editingPatient?.last_name} (ID: {editingPatient?.patient_id})</span>? 
                      This action might be irreversible. Consider deactivating the patient instead if they have linked records.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={deletePatientMutation.isLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Cancel</button>
                    <button type="button" onClick={confirmDeletePatient} disabled={deletePatientMutation.isLoading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:bg-red-400 disabled:cursor-not-allowed">
                      {deletePatientMutation.isLoading ? 'Deleting...' : 'Delete Patient'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default PatientListPage;
