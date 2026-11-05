"use client"

import ProtectedRoute from "@/src/components/app-shell/protected-route"
import SmithDetailsForm from "@/src/module/smith/component/smith-details-form"

// Create and edit smith (user) details.
export default function SmithCreateRoute() {
  return (
    <ProtectedRoute requiredProject="SMITH">
      <SmithDetailsForm />
    </ProtectedRoute>
  )
}
