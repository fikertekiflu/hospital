import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure path is correct
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  BuildingOfficeIcon,
  UserIcon as PatientIcon,
  BriefcaseIcon as DoctorIcon,
  HomeIcon as RoomIcon, // Using HomeIcon for Room, can change
  ArrowLeftIcon,
  CalendarDaysIcon,
  ChevronUpDownIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Reusable SelectField component (can be moved to common components)
const SelectField = ({ label, name, control, errors, required = false, options, placeholder, disabled, Icon, isLoading, onChange: customOnChange }) => (
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
            onChange={(e) => {
              field.onChange(e); // Call original react-hook-form onChange
              if (customOnChange) customOnChange(e); // Call custom onChange if provided
            }}
            id={name}
            disabled={disabled || isLoading}
            className={`block w-full py-3 ${Icon ? 'pl-11 pr-10' : 'pl-4 pr-10'} border ${errors[name] ? 'border-red-400' : 'border-slate-300'} 
                        rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                        text-sm text-slate-900 placeholder-slate-400 appearance-none transition-all duration-150 ease-in-out disabled:bg-slate-100
                        ${isLoading ? 'animate-pulse bg-slate-200' : 'bg-white'}`}
          >
            <option value="">{isLoading ? `Loading ${label.toLowerCase()}...` : placeholder || `Select ${label.toLowerCase()}...`}</option>
            {!isLoading && options?.map(option => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
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

// Reusable DateTimePickerField (can be moved to common components)
const DateTimePickerField = ({ label, name, control, errors, required = false, disabled, minDate }) => (
    <div className="relative">
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Controller
            name={name}
            control={control}
            rules={{ required: required ? `${label} is required.` : false }}
            render={({ field: { onChange, onBlur, value, ref } }) => (
                <div className="relative rounded-lg shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 z-10">
                        <CalendarDaysIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <DatePicker
                        id={name}
                        selected={value ? new Date(value) : null}
                        onChange={onChange}
                        onBlur={onBlur}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className={`block w-full pl-11 pr-4 py-3 border ${errors[name] ? 'border-red-400 ring-1 ring-red-400' : 'border-slate-300'} 
                                    rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                                    text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 ease-in-out 
                                    disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none`}
                        placeholderText="Select admission date and time"
                        disabled={disabled}
                        minDate={minDate} // Can be used to prevent past dates if needed
                        popperPlacement="bottom-start"
                        autoComplete="off"
                        ref={ref}
                    />
                </div>
            )}
        />
        {errors[name] && <p className="mt-1.5 text-xs text-red-600">{errors[name].message}</p>}
    </div>
);


const AdmissionCreatePage = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const queryParams = new URLSearchParams(location.search);
  const prefilledPatientId = queryParams.get('patientId');

  const [selectedPatientInfo, setSelectedPatientInfo] = useState(null);

  const { control, register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    mode: "onTouched",
    defaultValues: {
      patient_id: prefilledPatientId || '',
      room_id: '',
      admitting_doctor_id: '',
      admission_datetime: new Date(), // Default to now
      reason_for_admission: ''
    }
  });

  // Fetch Patients if patient_id is not pre-filled
  const { data: patientsData, isLoading: isLoadingPatients, error: patientsError } = useQuery({
    queryKey: ['patientsListForAdmission'],
    queryFn: async () => {
      if (!token) return [];
      const response = await axios.get(`${API_BASE_URL}/patient`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(p => ({ value: p.patient_id, label: `${p.first_name} ${p.last_name} (ID: ${p.patient_id})` }));
    },
    enabled: !!token && !prefilledPatientId,
  });

  // Fetch selected patient details if prefilledPatientId exists
   const { data: prefilledPatientData, isLoading: isLoadingPrefilledPatient } = useQuery({
    queryKey: ['patientDetailsForAdmission', prefilledPatientId],
    queryFn: async () => {
      if (!token || !prefilledPatientId) return null;
      const response = await axios.get(`${API_BASE_URL}/patient/${prefilledPatientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!token && !!prefilledPatientId,
    onSuccess: (data) => {
      if (data) {
        setSelectedPatientInfo(`${data.first_name} ${data.last_name} (ID: ${data.patient_id})`);
      }
    }
  });

  // Fetch Active Doctors
  const { data: doctorsData, isLoading: isLoadingDoctors, error: doctorsError } = useQuery({
    queryKey: ['activeDoctorsListForAdmission'],
    queryFn: async () => {
      if (!token) return [];
      const response = await axios.get(`${API_BASE_URL}/doctor?is_active=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(d => ({ value: d.doctor_id, label: `Dr. ${d.first_name} ${d.last_name} (${d.specialization || 'General'})` }));
    },
    enabled: !!token,
  });

  // Fetch Available Rooms
  const { data: roomsData, isLoading: isLoadingRooms, error: roomsError } = useQuery({
    queryKey: ['availableRoomsList'],
    queryFn: async () => {
      if (!token) return [];
      // Assuming backend filters for active and available rooms
      const response = await axios.get(`${API_BASE_URL}/room?is_active=true&only_available=true`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.map(r => ({ 
        value: r.room_id, 
        label: `Room ${r.room_number} (${r.room_type}) - Capacity: ${r.capacity}, Occupied: ${r.current_occupancy}`,
        disabled: !r.is_available // is_available is calculated by model
      }));
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (patientsError) toast.error(`Patients: ${patientsError.message}`);
    if (doctorsError) toast.error(`Doctors: ${doctorsError.message}`);
    if (roomsError) toast.error(`Rooms: ${roomsError.message}`);
  }, [patientsError, doctorsError, roomsError]);

  const admitPatientMutation = useMutation({
    mutationFn: (admissionData) => axios.post(`${API_BASE_URL}/admission`, admissionData, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    onSuccess: (response) => {
      toast.success('Patient admitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['rooms'] }); // To update room occupancy display elsewhere
      queryClient.invalidateQueries({ queryKey: ['availableRoomsList'] }); // Refetch available rooms
      queryClient.invalidateQueries({ queryKey: ['patientAdmissions', response.data.admission.patient_id] });
      reset();
      setSelectedPatientInfo(null); // Clear selected patient info
      // Optionally navigate to admission detail page or patient detail page
      // navigate(`/admissions/${response.data.admission.admission_id}`);
      navigate(`/patients/${response.data.admission.patient_id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to admit patient.');
    }
  });

  const onSubmit = (data) => {
    if (!currentUser?.linkedStaffId && (currentUser?.role === 'Doctor' || currentUser?.role === 'Nurse' || currentUser?.role === 'Receptionist')) {
      // This check might be more relevant if the admitting_doctor_id was auto-filled by logged-in user
      // For now, admitting_doctor_id is selected from a list.
    }

    const admissionData = {
      ...data,
      patient_id: parseInt(data.patient_id),
      room_id: parseInt(data.room_id),
      admitting_doctor_id: parseInt(data.admitting_doctor_id),
      admission_datetime: data.admission_datetime 
        ? format(new Date(data.admission_datetime), "yyyy-MM-dd'T'HH:mm:ss")
        : null,
      reason_for_admission: data.reason_for_admission || null,
    };
    admitPatientMutation.mutate(admissionData);
  };
  
  const handlePatientSelectionChange = async (event) => {
    const selectedId = event.target.value;
    setValue('patient_id', selectedId); // Update react-hook-form state
    if (selectedId && patientsData) {
        const patient = patientsData.find(p => p.value.toString() === selectedId);
        setSelectedPatientInfo(patient ? patient.label : null);
    } else {
        setSelectedPatientInfo(null);
    }
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
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 sm:p-8">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-12 w-12 text-white opacity-90 mr-5" />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Admit Patient</h1>
              <p className="mt-1.5 text-amber-100 text-sm">Process new in-patient admission.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
          {prefilledPatientId && (isLoadingPrefilledPatient || !prefilledPatientData) ? (
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 text-center">
                <p className="text-sm text-indigo-700 animate-pulse">Loading patient details...</p>
            </div>
          ) : prefilledPatientId && prefilledPatientData ? (
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-800">Admitting Patient:</h3>
                <p className="text-md text-indigo-700">{selectedPatientInfo}</p>
                <input type="hidden" {...register("patient_id")} value={prefilledPatientId} />
            </div>
          ) : (
            <SelectField
              label="Select Patient"
              name="patient_id"
              control={control}
              errors={errors}
              required
              options={patientsData || []}
              placeholder="Search or select patient..."
              disabled={isSubmitting || isLoadingPatients || admitPatientMutation.isLoading}
              Icon={PatientIcon}
              isLoading={isLoadingPatients}
              customOnChange={handlePatientSelectionChange} // To update selectedPatientInfo display
            />
          )}
          {selectedPatientInfo && !prefilledPatientId && ( // Display selected patient if not prefilled
             <p className="text-sm text-slate-600 -mt-3 ml-1">Selected: {selectedPatientInfo}</p>
          )}


          <SelectField
            label="Assign to Room"
            name="room_id"
            control={control}
            errors={errors}
            required
            options={roomsData || []}
            placeholder="Select available room..."
            disabled={isSubmitting || isLoadingRooms || admitPatientMutation.isLoading}
            Icon={RoomIcon}
            isLoading={isLoadingRooms}
          />
          
          <SelectField
            label="Admitting Doctor"
            name="admitting_doctor_id"
            control={control}
            errors={errors}
            required
            options={doctorsData || []}
            placeholder="Select admitting doctor..."
            disabled={isSubmitting || isLoadingDoctors || admitPatientMutation.isLoading}
            Icon={DoctorIcon}
            isLoading={isLoadingDoctors}
          />

          <DateTimePickerField
            label="Admission Date & Time"
            name="admission_datetime"
            control={control}
            errors={errors}
            required
            disabled={isSubmitting || admitPatientMutation.isLoading}
            minDate={new Date()} // Typically admit for now or future, can be adjusted
          />
          
          <div>
            <label htmlFor="reason_for_admission" className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason for Admission <span className="text-xs text-slate-500">(Optional)</span>
            </label>
            <textarea
              id="reason_for_admission"
              rows="4"
              placeholder="Enter reason for admission..."
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors disabled:bg-slate-50 placeholder-slate-400"
              {...register("reason_for_admission")}
              disabled={isSubmitting || admitPatientMutation.isLoading}
            />
          </div>


          <div className="pt-6 flex justify-end border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingPatients || isLoadingDoctors || isLoadingRooms || admitPatientMutation.isLoading}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105 active:scale-95 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting || admitPatientMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Admitting Patient...
                </>
              ) : (
                'Admit Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmissionCreatePage;
