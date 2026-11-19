"use client";

import ProtectedRoute from "@/src/components/app-shell/protected-route";
import WeightReport from "@/src/module/report/component/weight-report";

// Weight transaction report.
export default function WeightReportRoute() {
    return (
        <ProtectedRoute>
            <div className="mx-auto w-full p-3 sm:p-5">
                <WeightReport />
            </div>
        </ProtectedRoute>
    );
}
