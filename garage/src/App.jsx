import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import Settings from './pages/Settings';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Notifications from './pages/Notifications';
import Login from './pages/Login';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="services" element={<Services />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
