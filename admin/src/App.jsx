import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Revenue from './pages/Revenue';
import Payments from './pages/Payments';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import Users from './pages/Users';
import Employees from './pages/Employees';
import Garages from './pages/Garages';
import ChargingStations from './pages/ChargingStations';
import Messages from './pages/Messages';
import Bug from './pages/Bug';
import Remark from './pages/Remark';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Business from './pages/Business';
import Parking from './pages/Parking';
import Store from './pages/Store';
import { Navigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <FilterProvider>
        <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="payments" element={<Payments />} />
          <Route path="services" element={<Services />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="users" element={<Users />} />
          <Route path="employees" element={<Employees />} />
          <Route path="garages" element={<Garages />} />
          <Route path="charging-stations" element={<ChargingStations />} />
          <Route path="bug" element={<Bug />} />
          <Route path="remarks" element={<Remark />} />
          <Route path="messages" element={<Messages />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="business" element={<Business />} />
          <Route path="parking" element={<Parking />} />
          <Route path="store" element={<Store />} />
        </Route>

        {/* Catch all redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </FilterProvider>
  </BrowserRouter>
  );
};

export default App;
