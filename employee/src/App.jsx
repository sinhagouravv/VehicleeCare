import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Notifications from './pages/Notifications';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Analytics from './pages/Analytics';
import Details from './pages/Details';
import Finance from './pages/Finance';
import Makeup from './pages/Makeup';
import Overtime from './pages/Overtime';
import UploadDocuments from './pages/UploadDocuments';
import VirtualIDCard from './pages/VirtualIDCard';

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
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="details" element={<Details />} />
            <Route path="finance" element={<Finance />} />
            <Route path="makeup" element={<Makeup />} />
            <Route path="overtime" element={<Overtime />} />
            <Route path="upload-documents" element={<UploadDocuments />} />
            <Route path="virtual-id-card" element={<VirtualIDCard />} />
          </Route>

        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
