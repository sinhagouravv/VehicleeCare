import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import MyBookings from './pages/MyBookings';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Progress from './pages/Progress';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Overtime from './pages/Overtime';
import Vehicles from './pages/Vehicles';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import StaffOverview from './pages/StaffOverview';
import Reports from './pages/Reports';
import { AlertProvider } from './context/AlertContext';

const App = () => {
  return (
    <AlertProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="payments" element={<Payments />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="customers" element={<Customers />} />
              <Route path="staff" element={<Staff />} />
              <Route path="progress" element={<Progress />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="leave" element={<Leave />} />
              <Route path="overtime" element={<Overtime />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="services" element={<Services />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="staff-overview" element={<StaffOverview />} />
              <Route path="reports" element={<Reports />} />

            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AlertProvider>
  );
};

export default App;
