"use client";

import ProtectedRoute from "@/src/components/app-shell/protected-route";
import SmithReport from "@/src/module/report/component/smith-report";

// Smith summary report.
export default function SmithReportRoute() {
    return (
        <ProtectedRoute>
            <div className="mx-auto w-full p-2">
                <SmithReport />
            </div>
        </ProtectedRoute>
    );
}
