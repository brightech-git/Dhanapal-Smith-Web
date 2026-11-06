"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/src/features/auth/lib/auth-context";
import { canAccessPath, firstAllowedPath } from "@/src/features/auth/lib/access";
import { usePathname, useRouter } from "next/navigation";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
    requiredProject?: "SMITH" | "GV";
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, allDetails, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname() || "/";
    const allowed = isAuthenticated && canAccessPath(allDetails, pathname);
    const fallback = firstAllowedPath(allDetails);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) router.replace("/login");
        else if (!allowed && fallback && fallback !== pathname) router.replace(fallback);
    }, [isLoading, isAuthenticated, allowed, fallback, pathname, router]);

    if (isLoading || !isAuthenticated) return null;
    if (!allowed) return <div role="alert" className="p-6">You do not have access to this page. Contact your administrator for an assignment.</div>;
    return <>{children}</>;
}
