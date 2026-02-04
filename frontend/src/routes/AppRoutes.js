import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Landing page
import Landing from '../pages/common/Landing';
import TestMap from '../pages/TestMap';

// Shared pages (accessible to all logged-in users)
import Home from '../pages/common/Home';
import ActiveRequests from '../pages/common/ActiveRequests';
import Notifications from '../pages/common/Notifications';
import Profile from '../pages/common/Profile';
import Help from '../pages/common/Help';

// Hospital pages
import HospitalDashboard from '../pages/hospital/Dashboard';
import CreateRequest from '../pages/hospital/CreateRequest';
import RequestDetails from '../pages/hospital/RequestDetails';
import DonorCoordination from '../pages/hospital/DonorCoordination';

// Blood Bank pages
import BloodBankDashboard from '../pages/bloodbank/Dashboard';
import InventoryManagement from '../pages/bloodbank/InventoryManagement';
import AssignedRequests from '../pages/bloodbank/AssignedRequests';
import Donations from '../pages/bloodbank/Donations';
import TestingWorkflow from '../pages/bloodbank/TestingWorkflow';

// Donor pages
import DonorDashboard from '../pages/donor/Dashboard';
import DonorProfile from '../pages/donor/Profile';
import DonorAppointments from '../pages/donor/Appointments';

// College pages
import CollegeDashboard from '../pages/college/Dashboard';
import MobilizationTools from '../pages/college/MobilizationTools';

// Admin pages
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import AuditLogs from '../pages/admin/AuditLogs';
import AuditViewer from '../pages/admin/AuditViewer';
import AntiWastageMonitor from '../pages/admin/AntiWastageMonitor';

// Common
import Unauthorized from '../pages/common/Unauthorized';

const AppRoutes = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/';
    return '/home'; // All logged-in users go to /home
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <Register />}
      />
      <Route
        path="/test-map"
        element={<TestMap />}
      />

      {/* Shared routes - accessible to all logged-in users */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={['Hospital', 'BloodBank', 'Donor', 'College', 'Admin']}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute allowedRoles={['Hospital', 'BloodBank', 'Donor', 'College', 'Admin']}>
            <ActiveRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['Hospital', 'BloodBank', 'Donor', 'College', 'Admin']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['Hospital', 'BloodBank', 'Donor', 'College', 'Admin']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute allowedRoles={['Hospital', 'BloodBank', 'Donor', 'College', 'Admin']}>
            <Help />
          </ProtectedRoute>
        }
      />

      {/* Hospital routes */}
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Hospital']}>
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/create"
        element={
          <ProtectedRoute allowedRoles={['Hospital']}>
            <CreateRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/requests/create"
        element={
          <ProtectedRoute allowedRoles={['Hospital']}>
            <CreateRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/requests/:id"
        element={
          <ProtectedRoute allowedRoles={['Hospital']}>
            <RequestDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/donor-coordination"
        element={
          <ProtectedRoute allowedRoles={['Hospital']}>
            <DonorCoordination />
          </ProtectedRoute>
        }
      />

      {/* Blood Bank routes */}
      <Route
        path="/bloodbank/dashboard"
        element={
          <ProtectedRoute allowedRoles={['BloodBank']}>
            <BloodBankDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bloodbank/inventory"
        element={
          <ProtectedRoute allowedRoles={['BloodBank']}>
            <InventoryManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bloodbank/requests"
        element={
          <ProtectedRoute allowedRoles={['BloodBank']}>
            <AssignedRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bloodbank/donations"
        element={
          <ProtectedRoute allowedRoles={['BloodBank']}>
            <Donations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bloodbank/testing"
        element={
          <ProtectedRoute allowedRoles={['BloodBank']}>
            <TestingWorkflow />
          </ProtectedRoute>
        }
      />

      {/* Donor routes */}
      <Route
        path="/donor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/profile"
        element={
          <ProtectedRoute allowedRoles={['Donor']}>
            <DonorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/appointments"
        element={
          <ProtectedRoute allowedRoles={['Donor']}>
            <DonorAppointments />
          </ProtectedRoute>
        }
      />

      {/* College routes */}
      <Route
        path="/college/dashboard"
        element={
          <ProtectedRoute allowedRoles={['College']}>
            <CollegeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/mobilization"
        element={
          <ProtectedRoute allowedRoles={['College']}>
            <MobilizationTools />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-viewer"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AuditViewer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/anti-wastage"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AntiWastageMonitor />
          </ProtectedRoute>
        }
      />

      {/* Role-specific routes - redirects to role dashboards */}
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Hospital']}>
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bloodbank/dashboard"
        element={
          <ProtectedRoute allowedRoles={['BloodBank']}>
            <BloodBankDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/college/dashboard"
        element={
          <ProtectedRoute allowedRoles={['College']}>
            <CollegeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Common routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;

