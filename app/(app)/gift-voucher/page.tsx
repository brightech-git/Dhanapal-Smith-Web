"use client"

import ProtectedRoute from "@/src/components/app-shell/protected-route"
import GiftVoucherPage from "@/src/module/gift-voucher/component/gift-voucher-page"

// Gift voucher issue, receipt, introducers and report.
export default function GiftVoucherRoute() {
  return (
    <ProtectedRoute requiredProject="GV">
      <GiftVoucherPage />
    </ProtectedRoute>
  )
}
