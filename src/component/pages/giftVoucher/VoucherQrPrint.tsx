"use client";

import React, { useEffect, useRef } from "react";
import { VoucherGeneration } from "@/types/giftVoucher";
import { buildQrDataUrl } from "@/utils/qrSvg";

interface VoucherQrPrintProps {
    vouchers: VoucherGeneration[];
    /** Called after the print dialog has been opened (or immediately, if printing is skipped). */
    onDone?: () => void;
}

// Printable page size in CSS px (96dpi). Sized to comfortably fit the
// QR at the requested x:1000,y:1000 position plus its label below it,
// while keeping a portrait, half-A4-style page.
const PAGE_WIDTH_PX = 1200;
const PAGE_HEIGHT_PX = 1400;

// QR placed at this absolute position on each page, per spec.
const QR_POSITION_PX = { x: 1000, y: 1000 };
const QR_SIZE_PX = 160;

/**
 * Renders one print page per issued voucher, each with a QR code
 * (encoding that voucher's voucherNo) positioned at x:1000px, y:1000px,
 * then opens the browser print dialog automatically.
 */
const VoucherQrPrint: React.FC<VoucherQrPrintProps> = ({ vouchers, onDone }) => {
    const firedRef = useRef(false);

    useEffect(() => {
        if (firedRef.current || vouchers.length === 0) return;
        firedRef.current = true;

        // Let layout/paint settle before invoking print.
        const timer = setTimeout(() => {
            window.print();
        }, 300);

        const handleAfterPrint = () => {
            onDone?.();
        };
        window.addEventListener("afterprint", handleAfterPrint);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("afterprint", handleAfterPrint);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vouchers]);

    if (vouchers.length === 0) return null;

    return (
        <div className="voucher-qr-print-root">
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .voucher-qr-print-root,
                    .voucher-qr-print-root * {
                        visibility: visible;
                    }
                    .voucher-qr-print-root {
                        position: absolute;
                        inset: 0;
                    }
                    @page {
                        size: ${PAGE_WIDTH_PX}px ${PAGE_HEIGHT_PX}px;
                        margin: 0;
                    }
                }
            `}</style>

            {vouchers.map((voucher, index) => {
                const qrDataUrl = buildQrDataUrl(String(voucher.voucherNo), QR_SIZE_PX);

                return (
                    <div
                        key={voucher.id}
                        className="voucher-qr-page"
                        style={{
                            position: "relative",
                            width: `${PAGE_WIDTH_PX}px`,
                            height: `${PAGE_HEIGHT_PX}px`,
                            pageBreakAfter: index < vouchers.length - 1 ? "always" : "auto",
                            background: "#fff",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={qrDataUrl}
                            alt={`QR ${voucher.voucherCode}`}
                            width={QR_SIZE_PX}
                            height={QR_SIZE_PX}
                            style={{
                                position: "absolute",
                                left: `${QR_POSITION_PX.x}px`,
                                top: `${QR_POSITION_PX.y}px`,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                left: `${QR_POSITION_PX.x}px`,
                                top: `${QR_POSITION_PX.y + QR_SIZE_PX + 8}px`,
                                fontSize: "12px",
                                fontFamily: "monospace",
                                width: `${QR_SIZE_PX}px`,
                                textAlign: "center",
                            }}
                        >
                            {voucher.voucherCode}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VoucherQrPrint;
