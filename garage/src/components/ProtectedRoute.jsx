import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useMultiTabAuthSync from '../hooks/useMultiTabAuthSync';

const ProtectedRoute = () => {
    useMultiTabAuthSync();
    const token = localStorage.getItem('garageToken');
    const user = localStorage.getItem('garageUser');

    // If no token or user data is found, redirect to login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the child routes using Outlet
    return <Outlet />;
};

export default ProtectedRoute;
