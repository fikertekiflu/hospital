import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './features/auth/AuthContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleBasedRoute from './routes/RoleBasedRoute'; 
import LoginPage from './features/auth/LoginPage';
import DashboardDispatcher from './features/dashboard/DashboardDispatcher';
import PatientCreatePage from './features/patients/PatientCreatePage';
import AppointmentSchedulerPage from './features/appointments/AppointmentSchedulerPage';
import ManageAppointmentsPage from './features/appointments/ManageAppointmentsPage';

const PlaceholderPage = ({ title }) => <div className="p-6"><h1 className="text-2xl">{title}</h1><p>This page is under construction.</p></div>;
const PatientListPage = () => <PlaceholderPage title="Patient List" />;
const PatientDetailPage = () => <PlaceholderPage title="Patient Details" />;
const MyAppointmentsPage = () => <PlaceholderPage title="My Appointments" />;
const UserManagementPage = () => <PlaceholderPage title="Admin: User Management" />;
const StaffManagementPage = () => <PlaceholderPage title="Admin: Staff Management" />;
const RoomManagementPage = () => <PlaceholderPage title="Admin: Room Management" />;
const AdmissionPage = () => <PlaceholderPage title="Patient Admissions" />;
const StaffAssignmentPage = () => <PlaceholderPage title="Staff Assignments" />;
const MyTasksPage = () => <PlaceholderPage title="My Tasks" />;
const ServiceManagementPage = () => <PlaceholderPage title="Admin: Service Management" />;
const BillGenerationPage = () => <PlaceholderPage title="Generate Bill" />;
const PaymentPage = () => <PlaceholderPage title="Record Payment" />;
const TreatmentLogPage = () => <PlaceholderPage title="Log Treatment" />;


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <MainLayout> {/* This wraps all page content with Navbar/Footer */}
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes - User must be authenticated */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardDispatcher />} />
                
                {/* Patient Routes - Example: Receptionist, Doctor, Nurse, Admin might access list */}
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Doctor', 'Nurse', 'Admin']} />}>
                  <Route path="/patients" element={<PatientListPage />} />
                  <Route path="/patients/:patientId" element={<PatientDetailPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Admin']} />}>
                  <Route path="/patients/new" element={<PatientCreatePage />} />
                </Route>
                
                {/* Appointment Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Doctor', 'Admin']} />}>
                  <Route path="/appointments/schedule" element={<AppointmentSchedulerPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Receptionist', 'Doctor', 'Admin']} />}>
                  <Route path="/appointments/manage" element={<ManageAppointmentsPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Patient']} />}> {/* Assuming Patient role exists for self-view */}
                  <Route path="/appointments/my" element={<MyAppointmentsPage />} />
                </Route>
                {/* Staff Task Routes */}
                <Route element={<RoleBasedRoute allowedRoles={['Nurse', 'WardBoy']} />}>
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
                    <Route path="/billing/generate" element={<BillGenerationPage />} />
                    <Route path="/billing/payments" element={<PaymentPage />} />
                </Route>

                {/* Routes accessible by multiple clinical roles (further checks might be inside component) */}
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Nurse', 'Admin', 'Receptionist']} />}>
                    <Route path="/admissions" element={<AdmissionPage />} />
                </Route>
                <Route element={<RoleBasedRoute allowedRoles={['Doctor', 'Nurse', 'Admin']} />}>
                    <Route path="/assignments/new" element={<StaffAssignmentPage />} />
                    <Route path="/treatments/log" element={<TreatmentLogPage />} />
                </Route>

                {/* Fallback for unmatched authenticated routes */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </MainLayout>
          {/* Toaster for react-hot-toast notifications is often placed in MainLayout or here */}
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
