"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string; // Optional: for role-based access
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole
}) => {
    const { isAuthenticated, } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if ( !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated,  router]);

    

    // Redirect if not authenticated (handled by useEffect)
    if (!isAuthenticated) {
        return null;
    }

    // Optional: Check for specific roles
    if (requiredRole) {
        // Add your role checking logic here
        // For now, just render children since we have simple auth
        return <>{children}</>;
    }

    return <>{children}</>;
};

export default ProtectedRoute;