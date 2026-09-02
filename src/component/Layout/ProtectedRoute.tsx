"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/auth/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string; // Optional: for role-based access
    // Optional: restrict this route to a specific project type
    // ("SMITH" or "GV"). If the logged-in user belongs to a
    // different project, they are redirected to their own home page.
    requiredProject?: "SMITH" | "GV";
}

const projectHomePath = (projectName?: string) =>
    projectName === "GV" ? "/GiftVoucher" : "/";

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
    requiredProject,
}) => {


    const { isAuthenticated, allDetails } = useAuth();
    const router = useRouter();

    const projectName: string | undefined = allDetails?.projectName;
    console.log(projectName, allDetails, "projectName")

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (
            requiredProject &&
            projectName &&
            projectName !== requiredProject
        ) {
            router.push(projectHomePath(projectName));
        }
    }, [isAuthenticated, requiredProject, projectName, router]);

    // Redirect if not authenticated (handled by useEffect)
    if (!isAuthenticated) {
        return null;
    }

    // Redirect if logged in under a different project (handled by useEffect)
    if (
        requiredProject &&
        projectName &&
        projectName !== requiredProject
    ) {
        return null;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
