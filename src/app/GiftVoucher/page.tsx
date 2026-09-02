"use client";

import ProtectedRoute from "@/component/Layout/ProtectedRoute";
import GiftVoucherPage from "@/component/pages/giftVoucher/GiftVoucherPage";

function GiftVoucher() {
    return (
        <div>
            <ProtectedRoute requiredProject="GV">
                <GiftVoucherPage />
            </ProtectedRoute>
        </div>
    );
}

export default GiftVoucher;
