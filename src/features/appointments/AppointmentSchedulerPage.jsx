import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure this path is correct
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon,
  UserIcon as PatientIcon,
  BriefcaseIcon as DoctorIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronUpDownIcon // For select dropdown indicator
} from '@heroicons/react/24/outline'; // Using outline for a lighter feel
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Enhanced Reusable SelectField component
const SelectField = ({ label, name, control, errors, required = false, options, placeholder, disabled, Icon, isLoading }) => (
  <div className="relative">
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative rounded-lg shadow-sm">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? `${label} is required.` : false }}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            disabled={disabled || isLoading}
            className={`block w-full py-3 ${Icon ? 'pl-11 pr-10' : 'pl-4 pr-10'} border ${errors[name] ? 'border-red-400' : 'border-slate-300'} 
                        rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                        text-sm text-slate-900 placeholder-slate-400 appearance-none transition-all duration-150 ease-in-out disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
                        ${isLoading ? 'animate-pulse bg-slate-200' : 'bg-white'}`}
          >
            <option value="">{isLoading ? `Loading ${label.toLowerCase()}...` : placeholder || `Select ${label.toLowerCase()}...`}</option>
            {!isLoading && options?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      />
      {!isLoading && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
    {errors[name] && <p className="mt-1.5 text-xs text-red-600">{errors[name].message}</p>}
  </div>
);

// Enhanced DateTimePickerField component
const DateTimePickerField = ({ label, name, control, errors, required = false, disabled }) => (
    <div className="relative">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Controller
            name={name}
            control={control}
            rules={{ required: required ? `${label} is required.` : false }}
            render={({ field: { onChange, onBlur, value } }) => (
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <ClockIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <DatePicker
                        id={name}
                        selected={value ? new Date(value) : null}
                        onChange={onChange}
                        onBlur={onBlur}
                        showTimeSelect
                        timeFormat="HH:mm" // 24-hour format
                        timeIntervals={30} // 30-minute intervals
                        dateFormat="MMMM d, yyyy h:mm aa" // User-friendly display
                        className={`block w-full pl-11 pr-4 py-3 border ${errors[name] ? 'border-red-400' : 'border-slate-300'} 
                                    rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                                    text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 ease-in-out disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none`}
                        placeholderText="Select date and time"
                        disabled={disabled}
                        minDate={new Date()} // Prevent selecting past dates
                        popperPlacement="bottom-start"
                    />
                </div>
            )}
        />
        {errors[name] && <p className="mt-1.5 text-xs text-red-600">{errors[name].message}</p>}
    </div>
);


const AppointmentSchedulerPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm({
    mode: "onTouched",
    defaultValues: {
      patient_id: '',
      doctor_id: '',
      appointment_datetime: null,
      reason: ''
    }
  });

  // Watch selected doctor to potentially fetch their availability later
  const selectedDoctorId = watch('doctor_id');

  // Fetch Patients using React Query
  const { data: patientsData, isLoading: isLoadingPatients, error: patientsError } = useQuery({
    queryKey: ['patientsListForScheduler'], // More specific key
    queryFn: async () => {
      if (!token) throw new Error("Not authenticated");
      const response = await axios.get(`${API_BASE_URL}/patient`, { // Assuming a general patient list endpoint
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(p => ({ value: p.patient_id, label: `${p.first_name} ${p.last_name} (ID: ${p.patient_id})` }));
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  });
  
  // Fetch Active Doctors using React Query
  const { data: doctorsData, isLoading: isLoadingDoctors, error: doctorsError } = useQuery({
    queryKey: ['activeDoctorsListForScheduler'],
    queryFn: async () => {
      if (!token) throw new Error("Not authenticated");
      const response = await axios.get(`${API_BASE_URL}/doctor?is_active=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(d => ({ value: d.doctor_id, label: `Dr. ${d.first_name} ${d.last_name} (${d.specialization || 'General'})` }));
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (patientsError) toast.error(`Error fetching patients: ${patientsError.message}`);
    if (doctorsError) toast.error(`Error fetching doctors: ${doctorsError.message}`);
  }, [patientsError, doctorsError]);


  const onSubmit = async (data) => {
    const loadingToast = toast.loading('Scheduling appointment...');
    try {
      const appointmentData = {
        patient_id: parseInt(data.patient_id),
        doctor_id: parseInt(data.doctor_id),
        appointment_datetime: data.appointment_datetime 
          ? format(new Date(data.appointment_datetime), "yyyy-MM-dd'T'HH:mm:ss") 
          : null,
        reason: data.reason || null,
      };

      // TODO: Add backend check for doctor availability at this specific time before posting
      // This is a client-side placeholder for a more complex availability check.
      // For now, we rely on the backend to potentially return a 409 Conflict.

      await axios.post(`${API_BASE_URL}/appointment`, appointmentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.dismiss(loadingToast);
      toast.success('Appointment scheduled successfully!', { duration: 4000 });
      reset(); // Clear the form for a new entry
      // No navigation, user stays on the page to schedule another if needed.

    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule appointment.';
      toast.error(errorMessage);
      console.error("Error scheduling appointment:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-sky-600 to-cyan-400 p-6 sm:p-8">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-12 w-12 text-white opacity-90 mr-5" />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Schedule Appointment</h1>
              <p className="mt-1.5 text-sky-100 text-sm">Book a new visit for a patient with an available doctor.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6 md:space-y-8">
          <SelectField
            label="Select Patient"
            name="patient_id"
            control={control}
            errors={errors}
            required
            options={patientsData || []}
            placeholder="Search or select patient..."
            disabled={isSubmitting || isLoadingPatients}
            Icon={PatientIcon}
            isLoading={isLoadingPatients}
          />

          <SelectField
            label="Assign to Doctor"
            name="doctor_id"
            control={control}
            errors={errors}
            required
            options={doctorsData || []}
            placeholder="Select doctor..."
            disabled={isSubmitting || isLoadingDoctors}
            Icon={DoctorIcon}
            isLoading={isLoadingDoctors}
          />
          
          <DateTimePickerField
            label="Preferred Appointment Date & Time"
            name="appointment_datetime"
            control={control}
            errors={errors}
            required
            disabled={isSubmitting}
          />

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason for Visit <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <textarea
              id="reason"
              rows="4"
              placeholder="Briefly describe the reason for the appointment..."
              className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors disabled:bg-slate-50 placeholder-slate-400"
              {...register("reason")}
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingPatients || isLoadingDoctors}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105 active:scale-95 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scheduling...
                </>
              ) : (
                'Schedule Appointment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentSchedulerPage;
