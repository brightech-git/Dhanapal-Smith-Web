"use client"

import ProtectedRoute from "@/src/components/app-shell/protected-route"
import RolesPage from "@/src/module/role/component/roles-page"

// Roles, role permissions (ROLETRAN) and user roles.
export default function RolesRoute() {
  return (
    <ProtectedRoute requiredProject="SMITH">
      <RolesPage />
    </ProtectedRoute>
  )
}
