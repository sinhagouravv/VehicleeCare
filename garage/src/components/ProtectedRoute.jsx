import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('garageToken');
    const user = localStorage.getItem('garageUser');

    // If no token or user data is found, redirect to login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Otherwise, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
