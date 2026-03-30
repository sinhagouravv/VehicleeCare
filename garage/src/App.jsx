import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import MyBookings from './pages/MyBookings';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Vehicles from './pages/Vehicles';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
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
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="services" element={<Services />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
