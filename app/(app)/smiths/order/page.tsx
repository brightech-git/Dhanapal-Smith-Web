"use client"

import ProtectedRoute from "@/src/components/app-shell/protected-route"
import SmithOrderPage from "@/src/module/smith-order/component/smith-order-page"

// Smith orders with date and description entry.
export default function SmithOrderRoute() {
  return (
    <ProtectedRoute requiredProject="SMITH">
      <SmithOrderPage />
    </ProtectedRoute>
  )
}
