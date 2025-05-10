import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure path is correct
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  DocumentTextIcon,
  UserIcon as PatientIcon,
  BriefcaseIcon as DoctorIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable InputField component (can be moved to common components)
const FormInputField = ({ label, name, type = "text", register, errors, required = false, placeholder, defaultValue, disabled, rows }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        rows={rows || 3}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`block w-full px-3.5 py-2.5 border ${errors[name] ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'} 
                    rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                    sm:text-sm transition-colors disabled:bg-slate-50`}
        {...register(name, {
          required: required ? `${label} is required.` : false,
        })}
      />
    ) : (
      <input
        type={type}
        id={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`block w-full px-3.5 py-2.5 border ${errors[name] ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'} 
                    rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                    sm:text-sm transition-colors disabled:bg-slate-50`}
        {...register(name, {
          required: required ? `${label} is required.` : false,
        })}
      />
    )}
    {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
  </div>
);

// Reusable SelectField for patient selection
const PatientSelectField = ({ label, name, control, errors, required = false, options, placeholder, disabled, Icon, isLoading }) => (
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
                        text-sm text-slate-900 placeholder-slate-400 appearance-none transition-all duration-150 ease-in-out disabled:bg-slate-100
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


const LogTreatmentPage = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams(location.search);
  const prefilledPatientId = queryParams.get('patientId');
  const prefilledAppointmentId = queryParams.get('appointmentId');

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm({
    mode: "onTouched",
    defaultValues: {
      patient_id: prefilledPatientId || '',
      appointment_id: prefilledAppointmentId || '',
      treatment_name: '',
      diagnosis: '',
      treatment_plan: '',
      medications_prescribed: '',
      start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: ''
    }
  });

  // Fetch Patients if patient_id is not pre-filled
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patientsListForTreatmentLog'],
    queryFn: async () => {
      if (!token) return [];
      const response = await axios.get(`${API_BASE_URL}/patient`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(p => ({ value: p.patient_id, label: `${p.first_name} ${p.last_name} (ID: ${p.patient_id})` }));
    },
    enabled: !!token && !prefilledPatientId, // Only fetch if no patientId in query params
  });
  
  // Pre-select patient if ID comes from query params and patient list is loaded
  useEffect(() => {
    if (prefilledPatientId && patientsData) {
        const patientExists = patientsData.some(p => p.value.toString() === prefilledPatientId);
        if (patientExists) {
            setValue('patient_id', prefilledPatientId);
        } else {
            toast.error(`Patient ID ${prefilledPatientId} from URL not found in list. Please select manually.`);
        }
    }
  }, [prefilledPatientId, patientsData, setValue]);


  const logTreatmentMutation = useMutation({
    mutationFn: (treatmentData) => axios.post(`${API_BASE_URL}/treatment`, treatmentData, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    onSuccess: (response) => {
      toast.success('Treatment logged successfully!');
      // Invalidate queries to refetch data on other pages
      queryClient.invalidateQueries({ queryKey: ['patientTreatments', response.data.treatment.patient_id] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointmentsForDoctor'] }); // If dashboard shows treatment counts
      reset(); // Clear the form
      // Optionally navigate or show a success summary
      // navigate(`/patients/${response.data.treatment.patient_id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to log treatment.');
    }
  });

  const onSubmit = (data) => {
    if (!currentUser?.linkedStaffId && (currentUser?.role === 'Doctor' || currentUser?.role === 'Nurse')) {
        toast.error("Your user account is not linked to a staff profile. Please contact an administrator.");
        return;
    }

    const treatmentData = {
      ...data,
      patient_id: parseInt(data.patient_id),
      doctor_id: parseInt(currentUser.linkedStaffId), // Logged-in doctor/nurse's staff ID
      appointment_id: data.appointment_id ? parseInt(data.appointment_id) : null,
      // start_datetime is already formatted by the input type="datetime-local"
    };
    logTreatmentMutation.mutate(treatmentData);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 to-indigo-500 p-6 sm:p-8">
          <div className="flex items-center">
            <DocumentTextIcon className="h-12 w-12 text-white opacity-90 mr-5" />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Log New Treatment</h1>
              <p className="mt-1.5 text-purple-100 text-sm">Record clinical diagnosis, procedures, and notes.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
          {!prefilledPatientId && (
            <PatientSelectField
              label="Select Patient"
              name="patient_id"
              control={control}
              errors={errors}
              required
              options={patientsData || []}
              placeholder="Search or select patient..."
              disabled={isSubmitting || isLoadingPatients || logTreatmentMutation.isLoading}
              Icon={PatientIcon}
              isLoading={isLoadingPatients}
            />
          )}
          {prefilledPatientId && (
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200">
                <p className="text-sm text-indigo-700">
                    Logging treatment for Patient ID: <span className="font-semibold">{prefilledPatientId}</span>
                    {prefilledAppointmentId && <span> (Appointment ID: <span className="font-semibold">{prefilledAppointmentId}</span>)</span>}
                </p>
                 <input type="hidden" {...register("patient_id")} value={prefilledPatientId} />
                 {prefilledAppointmentId && <input type="hidden" {...register("appointment_id")} value={prefilledAppointmentId} />}
            </div>
          )}

          <FormInputField label="Treatment Name / Procedure" name="treatment_name" register={register} errors={errors} required placeholder="e.g., Consultation, Flu Vaccination, Wound Dressing" disabled={isSubmitting || logTreatmentMutation.isLoading} />
          <FormInputField label="Diagnosis" name="diagnosis" type="textarea" register={register} errors={errors} placeholder="Enter diagnosis details" disabled={isSubmitting || logTreatmentMutation.isLoading} />
          <FormInputField label="Treatment Plan" name="treatment_plan" type="textarea" register={register} errors={errors} placeholder="Outline the treatment plan" disabled={isSubmitting || logTreatmentMutation.isLoading} />
          <FormInputField label="Medications Prescribed" name="medications_prescribed" type="textarea" register={register} errors={errors} placeholder="List medications, dosage, frequency" disabled={isSubmitting || logTreatmentMutation.isLoading} />
          
          <FormInputField 
            label="Date & Time of Treatment" 
            name="start_datetime" 
            type="datetime-local" 
            register={register} 
            errors={errors} 
            required 
            disabled={isSubmitting || logTreatmentMutation.isLoading} 
          />
          
          <FormInputField label="Clinical Notes" name="notes" type="textarea" rows={4} register={register} errors={errors} placeholder="Enter any additional clinical notes..." disabled={isSubmitting || logTreatmentMutation.isLoading} />

          <div className="pt-6 flex justify-end border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting || logTreatmentMutation.isLoading}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105 active:scale-95 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting || logTreatmentMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Treatment...
                </>
              ) : (
                'Save Treatment Record'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogTreatmentPage;
