import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Users from './pages/Users';
import Garages from './pages/Garages';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="users" element={<Users />} />
          <Route path="garages" element={<Garages />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
