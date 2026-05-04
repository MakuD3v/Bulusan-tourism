import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const UserRoute = () => {
    const { user } = useAuth();

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default UserRoute;
