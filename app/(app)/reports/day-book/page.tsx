"use client";

import ProtectedRoute from "@/src/components/app-shell/protected-route";
import DaybookReport from "@/src/module/report/component/daybook-report";

// Day book report (replaces the weight and amount reports).
export default function DaybookReportRoute() {
    return (
        <ProtectedRoute>
            <div className="mx-auto w-full p-2">
                <DaybookReport />
            </div>
        </ProtectedRoute>
    );
}
