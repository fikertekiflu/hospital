import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './features/auth/AuthContext'; // Assuming useAuth is also exported or used via useContext

import DashboardDispatcher from './features/dashboard/DashboardDispatcher';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleBasedRoute from './routes/RoleBasedRoute'; 
import LoginPage from './features/auth/LoginPage';
import LandingPage from './features/dashboard/LandingPage';
import PatientCreatePage from './features/patients/PatientCreatePage';
import AppointmentSchedulerPage from './features/appointments/AppointmentSchedulerPage';
import ManageAppointmentsPage from './features/appointments/ManageAppointmentsPage';
import MySchedulePage from './features/appointments/MySchedulePage';
import PatientListPage from './features/patients/PatientListPage';
import PatientDetailPage from './features/patients/PatientDetailPage';
import AdmissionCreatePage from './features/admissions/AdmissionCreatePage';
import MyTasksPage from './features/assignments/MyTasksPage';


const PlaceholderPage = ({ title }) => <div className="p-6"><h1 className="text-2xl">{title}</h1><p>This page is under construction.</p></div>;
const UserManagementPage = () => <PlaceholderPage title="Admin: User Management" />;
const MyAppointmentsPage = () => <PlaceholderPage title="My Appointments" />;


const StaffManagementPage = () => <PlaceholderPage title="Admin: Staff Management" />;
const RoomManagementPage = () => <PlaceholderPage title="Admin: Room Management" />;

const AdmissionPage = () => <PlaceholderPage title="Patient Admissions Overview" />;
const StaffAssignmentPage = () => <PlaceholderPage title="Staff Assignments" />;

const ServiceManagementPage = () => <PlaceholderPage title="Admin: Service Management" />;
const GenerateBillPage = () => <PlaceholderPage title="Generate Bill" />;
const RecordPaymentPage = () => <PlaceholderPage title="Record Payment" />;
const TreatmentLogPage = () => <PlaceholderPage title="Log Treatment" />;
const ProfileSettingsPage = () => <PlaceholderPage title="My Account / Profile Settings" />;
const WardBoyReportsNewPage = () => <PlaceholderPage title="Ward Boy: Report New Issue" />;
const ViewServicesPage = () => <PlaceholderPage title="View Services & Pricing" />;
const ManageBillsPage = () => <PlaceholderPage title="Manage All Bills" />;
const ViewBillDetailsPage = () => <PlaceholderPage title="View Bill Details" />;

const queryClient = new QueryClient();

// This component will wrap all authenticated routes with the MainLayout
const AuthenticatedAppLayout = () => {
  return (
    <MainLayout>
      <Outlet /> {/* Child routes will render here, inside MainLayout */}
    </MainLayout>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          {/* Toaster available on all pages */}
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes - These do NOT use MainLayout with the sidebar */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Routes - These WILL use MainLayout with the sidebar */}
            <Route element={<ProtectedRoute />}> {/* Step 1: Ensure user is authenticated */}
              <Route element={<AuthenticatedAppLayout />}> {/* Step 2: Apply the layout with sidebar TO THESE NESTED ROUTES */}
                
                {/* Default authenticated route if user tries to go to "/" after login */}
                {/* This <Navigate> should ideally be inside ProtectedRoute or handled by it if user is already on "/" */}
                {/* For now, let's assume ProtectedRoute handles the initial redirect to /dashboard if authenticated and on / */}
                <Route path="/dashboard" element={<DashboardDispatcher />} />

                {/* Patient Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Doctor', 'Nurse', 'WardBoy', 'Admin']} />}>
                  <Route path="/patients" element={<PatientListPage />} />
                  <Route path="/patients/:patientId" element={<PatientDetailPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Admin']} />}>
                  <Route path="/patients/new" element={<PatientCreatePage />} />
                  {/* <Route path="/patients/:patientId/edit" element={<PatientEditPage />} /> */}
                </Route>
                
                {/* Appointment Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Doctor', 'Admin']} />}>
                  <Route path="/appointments/schedule" element={<AppointmentSchedulerPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Doctor', 'Nurse', 'Admin']} />}>
                    <Route path="/appointments/manage" element={<ManageAppointmentsPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Patient']} />}> {/* Assuming Patient role for self-view */}
                  <Route path="/appointments/my" element={<MyAppointmentsPage />} />
                </Route>
                <Route path="/appointments/:appointmentId" element={<PlaceholderPage title="Appointment Details" />} />


                {/* Doctor Specific Schedule */}
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Admin']} />}>
                    <Route path="/doctor/my-schedule" element={<MySchedulePage />} />
                </Route>

                {/* Staff Task Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Nurse', 'WardBoy', 'Doctor']} />}>
                    <Route path="/assignments/my-tasks" element={<MyTasksPage />} />
                </Route>
                
                {/* Admin Only Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Admin']} />}>
                  <Route path="/admin/users" element={<UserManagementPage />} />
                  <Route path="/admin/staff" element={<StaffManagementPage />} />
                  <Route path="/admin/rooms" element={<RoomManagementPage />} />
                  <Route path="/admin/services" element={<ServiceManagementPage />} />
                </Route>

                {/* Billing Staff / Admin Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Admin', 'BillingStaff']} />}>
                    <Route path="/billing/generate" element={<GenerateBillPage />} />
                    <Route path="/billing/payments/new" element={<RecordPaymentPage />} />
                    <Route path="/billing/manage-bills" element={<ManageBillsPage />} />
                    <Route path="/billing/bills/:billId" element={<ViewBillDetailsPage />} />
                </Route>

                {/* Routes accessible by multiple clinical roles */}
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Nurse', 'Admin', 'Receptionist']} />}>
                    <Route path="/admissions/new" element={<AdmissionCreatePage />} /> 
                    <Route path="/admissions" element={<AdmissionPage />} /> 
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Nurse', 'Admin']} />}>
                    <Route path="/assignments/new" element={<StaffAssignmentPage />} />
                    <Route path="/treatments/log" element={<TreatmentLogPage />} />
                </Route>

                {/* General Authenticated Routes */}
                <Route path="/profile/settings" element={<ProfileSettingsPage />} />
                <Route path="/services/view" element={<ViewServicesPage />} /> {/* For viewing services */}
                
                {/* Ward Boy Specific */}
                <Route element={<RoleBasedRoute allowedRoles={['WardBoy', 'Admin']} />}>
                    <Route path="/wardboy/reports/new" element={<WardBoyReportsNewPage />} />
                </Route>

                {/* Fallback for authenticated but unmatched routes */}
                {/* If user is authenticated and tries to go to "/", redirect to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
                <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
              </Route> {/* End of AuthenticatedAppLayout */}
            </Route> {/* End of ProtectedRoute */}

            {/* A general catch-all for truly undefined public routes could go here if needed */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
