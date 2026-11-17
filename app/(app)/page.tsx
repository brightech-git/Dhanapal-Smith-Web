"use client"

import ProtectedRoute from "@/src/components/app-shell/protected-route"
import SmithDashboardPage from "@/src/module/smith/component/smith-dashboard"

export default function SmithDashboardRoute() {
  return (
    <ProtectedRoute requiredProject="SMITH">
      <SmithDashboardPage />
    </ProtectedRoute>
  )
}
