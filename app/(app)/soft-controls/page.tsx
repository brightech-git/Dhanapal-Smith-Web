"use client";

import ProtectedRoute from "@/src/components/app-shell/protected-route";
import SoftControlPage from "@/src/module/soft-control/soft-control-page";

// Soft controls: per-client settings (CTLID / CTLNAME / CTLTEXT).
export default function SoftControlsRoute() {
    return (
        <ProtectedRoute>
            <SoftControlPage />
        </ProtectedRoute>
    );
}
