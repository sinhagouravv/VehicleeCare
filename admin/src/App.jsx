import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import Users from './pages/Users';
import Garages from './pages/Garages';
import ChargingStations from './pages/ChargingStations';
import Franchise from './pages/Franchise';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="services" element={<Services />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="users" element={<Users />} />
          <Route path="garages" element={<Garages />} />
          <Route path="charging-stations" element={<ChargingStations />} />
          <Route path="franchise" element={<Franchise />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
