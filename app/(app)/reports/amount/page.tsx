"use client";

import ProtectedRoute from "@/src/components/app-shell/protected-route";
import AmountReport from "@/src/module/report/component/amount-report";

// Amount transaction report.
export default function AmountReportRoute() {
    return (
        <ProtectedRoute>
            <div className="mx-auto w-full p-3 sm:p-5">
                <AmountReport />
            </div>
        </ProtectedRoute>
    );
}
