import React, { useState, Fragment } from 'react'; // Added Fragment for Transition
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { UserPlusIcon, ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react'; // For Modal
import { format, parseISO } from 'date-fns'; // For formatting dates

// Updated API URL
const API_BASE_URL =  'http://localhost:3000/api';

// Reusable InputField component (same as before)
const InputField = ({ label, name, type = "text", register, errors, required = false, pattern, placeholder, disabled, Icon }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative rounded-md shadow-sm">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <input
        type={type}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        className={`block w-full px-3 py-2.5 border ${errors[name] ? 'border-red-500' : 'border-slate-300'} 
                    rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                    sm:text-sm transition-colors duration-150 ease-in-out disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
                    ${Icon ? 'pl-10' : ''}`}
        {...register(name, {
          required: required ? `${label} is required.` : false,
          pattern: pattern ? { value: pattern.value, message: pattern.message } : undefined,
        })}
      />
    </div>
    {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
  </div>
);

// Reusable SelectField component (same as before)
const SelectField = ({ label, name, register, errors, required = false, options, disabled, Icon }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative rounded-md shadow-sm">
       {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <select
        id={name}
        disabled={disabled}
        className={`block w-full px-3 py-2.5 border ${errors[name] ? 'border-red-500' : 'border-slate-300'} 
                    rounded-lg focus:outline-none focus:ring-2 ${errors[name] ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'} 
                    sm:text-sm appearance-none transition-colors duration-150 ease-in-out disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none
                    ${Icon ? 'pl-10' : ''}`}
        {...register(name, { required: required ? `${label} is required.` : false })}
      >
        <option value="">Select {label.toLowerCase()}...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
    {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
  </div>
);


const PatientCreatePage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    mode: "onTouched"
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientDetails, setNewPatientDetails] = useState(null);

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const onSubmit = async (data) => {
    const loadingToast = toast.loading('Registering patient...');
    try {
      const patientData = {
        ...data,
        date_of_birth: data.date_of_birth ? format(new Date(data.date_of_birth), 'yyyy-MM-dd') : null,
        email: data.email || null,
        address: data.address || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        gender: data.gender || null,
      };

      // Corrected API endpoint
      const response = await axios.post(`${API_BASE_URL}/patient`, patientData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.dismiss(loadingToast);
      toast.success('Patient registered successfully!');
      
      // Set details for modal and open it
      setNewPatientDetails(response.data.patient); // Assuming backend returns { patient: {...} }
      setIsModalOpen(true);
      
      reset(); // Clear the form for next entry


    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register patient.';
      toast.error(errorMessage);
      console.error("Error registering patient:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewPatientDetails(null);
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8">
            <div className="flex items-center">
              <UserPlusIcon className="h-10 w-10 text-white mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-white">Register New Patient</h1>
                <p className="mt-1 text-indigo-200 text-sm">Enter the patient's details below.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            {/* Personal Information Section */}
            <section>
              <h2 className="text-xl font-semibold text-slate-700 mb-6 border-b pb-3">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <InputField label="First Name" name="first_name" register={register} errors={errors} required />
                <InputField label="Last Name" name="last_name" register={register} errors={errors} required />
                <InputField label="Date of Birth" name="date_of_birth" type="date" register={register} errors={errors} required />
                <SelectField label="Gender" name="gender" register={register} errors={errors} options={genderOptions} />
              </div>
            </section>

            {/* Contact Information Section */}
            <section>
              <h2 className="text-xl font-semibold text-slate-700 mb-6 border-b pb-3">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <InputField
                  label="Phone Number"
                  name="phone_number"
                  type="tel"
                  register={register}
                  errors={errors}
                  required
                  placeholder="e.g., 0911223344"
                  pattern={{
                    value: /^[0-9\s+-]{9,15}$/,
                    message: "Invalid phone number format."
                  }}
                />
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  register={register}
                  errors={errors}
                  placeholder="e.g., patient@example.com"
                  pattern={{
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address."
                  }}
                />
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    placeholder="Enter full address"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    {...register("address")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </section>

            {/* Emergency Contact Section */}
            <section>
              <h2 className="text-xl font-semibold text-slate-700 mb-6 border-b pb-3">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <InputField label="Emergency Contact Name" name="emergency_contact_name" register={register} errors={errors} placeholder="Full name"/>
                <InputField
                  label="Emergency Contact Phone"
                  name="emergency_contact_phone"
                  type="tel"
                  register={register}
                  errors={errors}
                  placeholder="e.g., 0955667788"
                  pattern={{
                    value: /^[0-9\s+-]{9,15}$/,
                    message: "Invalid phone number format."
                  }}
                />
              </div>
            </section>

            {/* Submission Button */}
            <div className="pt-6 border-t border-slate-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => reset()}
                disabled={isSubmitting}
                className="px-6 py-2.5 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  'Register Patient'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Patient Creation Success Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-green-700 flex items-center"
                  >
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                    Patient Registered Successfully!
                  </Dialog.Title>
                  {newPatientDetails && (
                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p><strong className="font-medium">Patient ID:</strong> {newPatientDetails.patient_id}</p>
                      <p><strong className="font-medium">Name:</strong> {newPatientDetails.first_name} {newPatientDetails.last_name}</p>
                      <p><strong className="font-medium">Date of Birth:</strong> {newPatientDetails.date_of_birth ? format(parseISO(newPatientDetails.date_of_birth), 'MMMM d, yyyy') : 'N/A'}</p>
                      <p><strong className="font-medium">Phone:</strong> {newPatientDetails.phone_number}</p>
                      {newPatientDetails.email && <p><strong className="font-medium">Email:</strong> {newPatientDetails.email}</p>}
                    </div>
                  )}
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
                    >
                      OK, Got it!
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default PatientCreatePage;
