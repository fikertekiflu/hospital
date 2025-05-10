import React, { Fragment, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth'; // Ensure path is correct
import toast from 'react-hot-toast';
import { format, parseISO, differenceInYears, isValid } from 'date-fns';
import {
  UserCircleIcon,
  CakeIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MapPinIcon,
  UsersIcon, // For emergency contact
  ArrowLeftIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  PlusCircleIcon,
  BuildingOfficeIcon, // For admission
  DocumentTextIcon, // For treatments
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Tab, Dialog, Transition } from '@headlessui/react'; // For tabbed interface and Modals
import { useForm, Controller } from 'react-hook-form'; // For Log Treatment Modal form


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper function for classNames in Tabs
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// LogTreatmentModal (can be moved to its own file later)
const LogTreatmentModal = ({ isOpen, onClose, patientId, appointmentId, doctorId }) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting: isFormSubmitting } } = useForm({
    defaultValues: {
      treatment_name: '',
      diagnosis: '',
      treatment_plan: '',
      medications_prescribed: '',
      start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"), 
      notes: ''
    }
  });

  const logTreatmentMutation = useMutation({
    mutationFn: (treatmentData) => axios.post(`${API_BASE_URL}/treatment`, treatmentData, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),
    onSuccess: () => {
      toast.success('Treatment logged successfully!');
      queryClient.invalidateQueries({ queryKey: ['patientTreatments', patientId] });
      onClose(); 
      reset();   
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to log treatment.');
    }
  });

  const onSubmitLogTreatment = (data) => {
    const treatmentData = {
      ...data,
      patient_id: parseInt(patientId),
      doctor_id: parseInt(doctorId), 
      appointment_id: appointmentId ? parseInt(appointmentId) : null,
    };
    logTreatmentMutation.mutate(treatmentData);
  };
  
  useEffect(() => { 
    if (isOpen) {
        reset({
            treatment_name: '',
            diagnosis: '',
            treatment_plan: '',
            medications_prescribed: '',
            start_datetime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            notes: ''
        });
    }
  }, [isOpen, patientId, reset]);


  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-slate-800 mb-5 flex items-center">
                  <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  Log New Treatment for Patient ID: {patientId}
                </Dialog.Title>
                <form onSubmit={handleSubmit(onSubmitLogTreatment)} className="space-y-4">
                  <div>
                    <label htmlFor="treatment_name" className="block text-sm font-medium text-slate-700">Treatment Name/Type</label>
                    <input type="text" id="treatment_name" {...register("treatment_name", { required: "Treatment name is required" })}
                           className={`mt-1 block w-full px-3 py-2 border ${errors.treatment_name ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} 
                           disabled={isFormSubmitting || logTreatmentMutation.isLoading} />
                    {errors.treatment_name && <p className="text-xs text-red-500 mt-1">{errors.treatment_name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-slate-700">Diagnosis</label>
                    <textarea id="diagnosis" rows="2" {...register("diagnosis")}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                              disabled={isFormSubmitting || logTreatmentMutation.isLoading}/>
                  </div>
                  <div>
                    <label htmlFor="treatment_plan" className="block text-sm font-medium text-slate-700">Treatment Plan</label>
                    <textarea id="treatment_plan" rows="3" {...register("treatment_plan")}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                              disabled={isFormSubmitting || logTreatmentMutation.isLoading}/>
                  </div>
                  <div>
                    <label htmlFor="medications_prescribed" className="block text-sm font-medium text-slate-700">Medications Prescribed</label>
                    <textarea id="medications_prescribed" rows="2" {...register("medications_prescribed")}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                              disabled={isFormSubmitting || logTreatmentMutation.isLoading}/>
                  </div>
                  <div>
                    <label htmlFor="start_datetime_treatment" className="block text-sm font-medium text-slate-700">Date & Time of Treatment</label>
                    <input type="datetime-local" id="start_datetime_treatment" {...register("start_datetime", { required: "Start date/time is required" })}
                           className={`mt-1 block w-full px-3 py-2 border ${errors.start_datetime ? 'border-red-500' : 'border-slate-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`} 
                           disabled={isFormSubmitting || logTreatmentMutation.isLoading}/>
                    {errors.start_datetime && <p className="text-xs text-red-500 mt-1">{errors.start_datetime.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Additional Notes</label>
                    <textarea id="notes" rows="3" {...register("notes")}
                              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                              disabled={isFormSubmitting || logTreatmentMutation.isLoading}/>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} disabled={isFormSubmitting || logTreatmentMutation.isLoading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Cancel</button>
                    <button type="submit" disabled={isFormSubmitting || logTreatmentMutation.isLoading} className="inline-flex items-center justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:bg-indigo-300">
                      {isFormSubmitting || logTreatmentMutation.isLoading ? 'Saving...' : 'Save Treatment'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};


const PatientDetailPage = () => {
  const { patientId } = useParams(); 
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isLogTreatmentModalOpen, setIsLogTreatmentModalOpen] = useState(false);
  const [currentAppointmentForTreatmentLog, setCurrentAppointmentForTreatmentLog] = useState(null);


  // Fetch Patient Details
  const { data: patient, isLoading: isLoadingPatient, error: patientError } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!token || !patientId) return null;
      const response = await axios.get(`${API_BASE_URL}/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!token && !!patientId,
  });

  // Fetch Patient's Appointments
  const { data: appointments, isLoading: isLoadingAppointments, error: appointmentsError } = useQuery({
    queryKey: ['patientAppointments', patientId],
    queryFn: async () => {
      if (!token || !patientId) return [];
      const response = await axios.get(`${API_BASE_URL}/appointment/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.sort((a,b) => new Date(b.appointment_datetime) - new Date(a.appointment_datetime)); 
    },
    enabled: !!token && !!patientId && !!patient, 
  });

  // Fetch Patient's Treatments
  const { data: treatments, isLoading: isLoadingTreatments, error: treatmentsError } = useQuery({
    queryKey: ['patientTreatments', patientId],
    queryFn: async () => {
      if (!token || !patientId) return [];
      const response = await axios.get(`${API_BASE_URL}/treatment/patient/${patientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.sort((a,b) => new Date(b.start_datetime) - new Date(a.start_datetime)); 
    },
    enabled: !!token && !!patientId && !!patient, 
  });
  
  useEffect(() => {
    if (patientError) toast.error(`Patient Details: ${patientError.response?.data?.message || patientError.message}`);
    if (appointmentsError) toast.error(`Appointments: ${appointmentsError.response?.data?.message || appointmentsError.message}`);
    if (treatmentsError) toast.error(`Treatments: ${treatmentsError.response?.data?.message || treatmentsError.message}`);
  }, [patientError, appointmentsError, treatmentsError]);

  const openLogTreatmentModal = (appointment = null) => {
    setCurrentAppointmentForTreatmentLog(appointment); 
    setIsLogTreatmentModalOpen(true);
  };

  const getAge = (dobString) => {
    if (!dobString || !isValid(parseISO(dobString))) return 'N/A';
    return differenceInYears(new Date(), parseISO(dobString));
  };
  
  const canEditPatient = currentUser?.role === 'Admin' || currentUser?.role === 'Receptionist';
  const canLogClinicalData = currentUser?.role === 'Admin' || currentUser?.role === 'Doctor' || currentUser?.role === 'Nurse';


  if (isLoadingPatient) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-slate-700 text-lg">Loading Patient Details...</p>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="p-6 bg-red-50 rounded-lg shadow-md text-center max-w-lg mx-auto mt-10">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-700">Error Loading Patient</h2>
        <p className="text-slate-600 mt-2">{patientError?.response?.data?.message || patientError?.message || 'Patient not found or an error occurred.'}</p>
        <button onClick={() => navigate(-1)} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
          <ArrowLeftIcon className="h-5 w-5 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  // Tab Categories
  const categories = ['Appointments', 'Treatments', 'Admissions (Soon)']; 

  return (
    <div className="p-1 md:p-4 space-y-8 animate-fadeIn">
      <button
        onClick={() => navigate(-1)} 
        className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back
      </button>

      {/* Patient Banner */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <UserCircleIcon className="h-16 w-16 sm:h-20 sm:w-20 text-indigo-200 mr-4 sm:mr-6 flex-shrink-0" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{patient.first_name} {patient.last_name}</h1>
              <p className="text-sm text-indigo-200">Patient ID: PID-{String(patient.patient_id).padStart(4, '0')}</p>
            </div>
          </div>
          {canEditPatient && (
            <Link 
              to={`/patients/${patient.patient_id}/edit`} 
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" /> Edit Details
            </Link>
          )}
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
          <div className="flex items-center"><CakeIcon className="h-5 w-5 mr-2 text-indigo-300"/> DOB: {patient.date_of_birth ? format(parseISO(patient.date_of_birth), 'PPP') : 'N/A'} ({getAge(patient.date_of_birth)} yrs)</div>
          <div className="flex items-center"><UsersIcon className="h-5 w-5 mr-2 text-indigo-300"/> Gender: {patient.gender || 'N/A'}</div>
          <div className="flex items-center"><DevicePhoneMobileIcon className="h-5 w-5 mr-2 text-indigo-300"/> Phone: {patient.phone_number}</div>
          <div className="flex items-center col-span-1 sm:col-span-2 lg:col-span-1"><EnvelopeIcon className="h-5 w-5 mr-2 text-indigo-300"/> Email: {patient.email || 'N/A'}</div>
          <div className="flex items-start col-span-1 sm:col-span-2 lg:col-span-3"><MapPinIcon className="h-5 w-5 mr-2 text-indigo-300 flex-shrink-0 mt-0.5"/> Address: {patient.address || 'N/A'}</div>
          {patient.emergency_contact_name && (
            <div className="flex items-center col-span-1 sm:col-span-2 lg:col-span-3"><UsersIcon className="h-5 w-5 mr-2 text-indigo-300"/> Emergency: {patient.emergency_contact_name} ({patient.emergency_contact_phone || 'N/A'})</div>
          )}
        </div>
      </header>

      {/* Action Buttons */}
      {canLogClinicalData && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            <button onClick={() => openLogTreatmentModal()} className="w-full flex items-center justify-center text-left p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2">
                <DocumentTextIcon className="h-8 w-8 mr-3"/> 
                <div>
                    <span className="font-semibold">Log New Treatment</span>
                    <p className="text-xs text-green-100">Record diagnosis, meds, notes</p>
                </div>
            </button>
            <Link to={`/appointments/schedule?patientId=${patient.patient_id}`} className="w-full flex items-center justify-center text-left p-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2">
                <CalendarDaysIcon className="h-8 w-8 mr-3"/> 
                <div>
                    <span className="font-semibold">Schedule Follow-up</span>
                    <p className="text-xs text-sky-100">Book a new appointment</p>
                </div>
            </Link>
            <button onClick={() => navigate(`/admissions/new?patientId=${patient.patient_id}`)} className="w-full flex items-center justify-center text-left p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2">
                <BuildingOfficeIcon className="h-8 w-8 mr-3"/> 
                <div>
                    <span className="font-semibold">Admit Patient</span>
                    <p className="text-xs text-amber-100">Process hospital admission</p>
                </div>
            </button>
        </section>
      )}

      {/* Tabbed Interface for History */}
      <section className="bg-white rounded-xl shadow-xl p-2 sm:p-4">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-lg bg-slate-200 p-1">
            {categories.map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60 transition-all',
                    selected
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-slate-600 hover:bg-white/[0.70] hover:text-slate-900'
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-3">
            <Tab.Panel className={classNames('rounded-xl bg-white p-3', 'focus:outline-none')}>
              <h3 className="text-lg font-medium text-slate-700 mb-3">Appointment History</h3>
              {isLoadingAppointments ? <div className="text-center py-4"><p className="text-slate-500">Loading appointments...</p></div> : 
               appointmentsError ? <p className="text-red-600 bg-red-50 p-3 rounded-md">Could not load appointments: {appointmentsError.message}</p> : (
                appointments && appointments.length > 0 ? (
                  <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {appointments.map(appt => (
                      <li key={appt.appointment_id} className="p-3.5 bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold text-indigo-700">
                            {/* CORRECTED LINE BELOW */}
                            {appt.appointment_datetime ? format(parseISO(appt.appointment_datetime), 'PPP p') : 'N/A'}
                            </p>
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${appt.status === 'Completed' ? 'bg-green-100 text-green-800' : appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {appt.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">With: Dr. {appt.doctor_first_name} {appt.doctor_last_name} ({appt.doctor_specialization || 'N/A'})</p>
                        <p className="text-xs text-slate-500 mt-1">Reason: {appt.reason || 'N/A'}</p>
                         {canLogClinicalData && (appt.status === 'Completed' || appt.status === 'Checked-In' || appt.status === 'In Progress') && ( 
                            <button 
                                onClick={() => openLogTreatmentModal(appt)} 
                                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center"
                            >
                                <DocumentTextIcon className="h-4 w-4 mr-1"/> Log/View Treatment
                            </button>
                         )}
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-center py-10"><InformationCircleIcon className="h-10 w-10 text-slate-400 mx-auto mb-2"/><p className="text-slate-500">No appointments found for this patient.</p></div>
              )}
            </Tab.Panel>
            <Tab.Panel className={classNames('rounded-xl bg-white p-3', 'focus:outline-none')}>
              <h3 className="text-lg font-medium text-slate-700 mb-3">Treatment History</h3>
              {isLoadingTreatments ? <div className="text-center py-4"><p className="text-slate-500">Loading treatments...</p></div> : 
               treatmentsError ? <p className="text-red-600 bg-red-50 p-3 rounded-md">Could not load treatments: {treatmentsError.message}</p> : (
                treatments && treatments.length > 0 ? (
                  <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {treatments.map(treat => (
                      <li key={treat.treatment_id} className="p-3.5 bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-semibold text-purple-700">
                            {/* CORRECTED LINE BELOW */}
                            {treat.start_datetime ? format(parseISO(treat.start_datetime), 'PPP p') : 'N/A'}
                            </p>
                            {treat.treatment_name && <span className="text-xs text-slate-500 bg-purple-100 px-2 py-0.5 rounded-full">{treat.treatment_name}</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">By: Dr. {treat.doctor_first_name} {treat.doctor_last_name}</p>
                        {treat.diagnosis && <p className="text-xs text-slate-500 mt-1"><strong>Diagnosis:</strong> {treat.diagnosis}</p>}
                        {treat.medications_prescribed && <p className="text-xs text-slate-500 mt-1"><strong>Medications:</strong> {treat.medications_prescribed}</p>}
                        {treat.treatment_plan && <p className="text-xs text-slate-500 mt-1"><strong>Plan:</strong> {treat.treatment_plan}</p>}
                        {treat.notes && <p className="text-xs text-slate-500 mt-1"><strong>Notes:</strong> {treat.notes}</p>}
                      </li>
                    ))}
                  </ul>
                ) : <div className="text-center py-10"><InformationCircleIcon className="h-10 w-10 text-slate-400 mx-auto mb-2"/><p className="text-slate-500">No treatment records found for this patient.</p></div>
              )}
            </Tab.Panel>
            <Tab.Panel className={classNames('rounded-xl bg-white p-3', 'focus:outline-none')}>
              <h3 className="text-lg font-medium text-slate-700 mb-3">Admission History</h3>
              <div className="text-center py-10"><InformationCircleIcon className="h-10 w-10 text-slate-400 mx-auto mb-2"/><p className="text-slate-500">Admission history will be displayed here once implemented.</p></div>
              {/* TODO: Fetch and display admissions: GET /api/admissions/patient/:patientId */}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </section>

      {/* Log Treatment Modal */}
      <LogTreatmentModal 
        isOpen={isLogTreatmentModalOpen} 
        onClose={() => setIsLogTreatmentModalOpen(false)}
        patientId={patient?.patient_id}
        appointmentId={currentAppointmentForTreatmentLog?.appointment_id} 
        doctorId={currentUser?.linkedStaffId} 
      />
    </div>
  );
};

export default PatientDetailPage;
