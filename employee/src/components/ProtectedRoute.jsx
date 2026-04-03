import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    // Check if token exists in localStorage
    const isAuthenticated = localStorage.getItem('employeeToken');

    // If not authenticated, redirect to login page
    // Otherwise, render the child routes using Outlet
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
