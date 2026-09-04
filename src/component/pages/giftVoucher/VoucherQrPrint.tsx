"use client";

import React from "react";
import { VoucherGeneration } from "@/types/giftVoucher";
import { buildQrDataUrl } from "@/utils/qrSvg";
import { amountToRupeeWords } from "@/utils/numberToWords";
import { useConfig } from "@/context/Config/ConfigContext";

interface VoucherQrPrintProps {
    vouchers: VoucherGeneration[];
   
    onDone?: () => void;
}

// Card + page size in CSS px (96dpi).
const CARD_WIDTH_PX = 700;
const CARD_HEIGHT_PX = 450;
const PAGE_MARGIN_PX = 30;
const PAGE_WIDTH_PX = CARD_WIDTH_PX + PAGE_MARGIN_PX * 2;
const PAGE_HEIGHT_PX = CARD_HEIGHT_PX + PAGE_MARGIN_PX * 2;

const QR_SIZE_PX = 90;
const VALIDITY_DAYS = 365; // voucher stays valid for exactly one year from its created date

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

function formatDate(value: string | number | Date): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";
    return dateFormatter.format(date);
}

function addDays(value: string | number | Date, days: number): Date {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
}

function formatRupees(amount: number, decimals: boolean): string {
    return `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: decimals ? 2 : 0,
        maximumFractionDigits: decimals ? 2 : 0,
    })}`;
}
const VoucherQrPrint: React.FC<VoucherQrPrintProps> = ({ vouchers, onDone }) => {
    const config = useConfig();
    const companyName = config?.COMPANYNAME || config?.COMPANY_NAME || "Gift Voucher";
    const companyInitial = companyName.trim().charAt(0).toUpperCase() || "G";

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
                    .no-print {
                        display: none !important;
                    }
                }

                .print-toolbar {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    max-width: ${PAGE_WIDTH_PX}px;
                    margin: 0 auto 12px;
                }
                .print-toolbar button {
                    font-family: inherit;
                    font-size: 13px;
                    font-weight: 600;
                    padding: 8px 18px;
                    border-radius: 6px;
                    cursor: pointer;
                    border: 1px solid #16305c;
                }
                .print-toolbar .btn-print {
                    background: #16305c;
                    color: #fff;
                }
                .print-toolbar .btn-close {
                    background: #fff;
                    color: #16305c;
                }

                .voucher-card {
                    position: relative;
                    width: ${CARD_WIDTH_PX}px;
                    height: ${CARD_HEIGHT_PX}px;
                    display: flex;
                    background: linear-gradient(135deg, #fbf7ec 0%, #f3e8cd 100%);
                    border: 2px solid #c9a227;
                    border-radius: 18px;
                    overflow: hidden;
                    box-sizing: border-box;
                    font-family: Georgia, "Times New Roman", serif;
                    color: #16305c;
                    box-shadow: 0 8px 24px rgba(22, 48, 92, 0.12);
                }

                /* Diagonal gold lattice watermark pattern across the whole card,
                   matching the crossed fine-line diamond texture in the reference. */
                .voucher-card .lattice-bg {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    opacity: 0.55;
                    background-image: repeating-linear-gradient(
                            45deg,
                            rgba(201, 162, 39, 0.16) 0px,
                            rgba(201, 162, 39, 0.16) 1px,
                            transparent 1px,
                            transparent 34px
                        ),
                        repeating-linear-gradient(
                            -45deg,
                            rgba(22, 48, 92, 0.08) 0px,
                            rgba(22, 48, 92, 0.08) 1px,
                            transparent 1px,
                            transparent 34px
                        );
                }
                /* Slightly denser lattice fading in on the right-hand panel,
                   like the reference card. */
                .voucher-card .lattice-bg::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to right,
                        rgba(251, 247, 236, 1) 0%,
                        rgba(251, 247, 236, 0.55) 34%,
                        rgba(251, 247, 236, 0.15) 60%,
                        rgba(251, 247, 236, 0) 100%
                    );
                }

                .voucher-card .corner {
                    position: absolute;
                    width: 0;
                    height: 0;
                    z-index: 1;
                }
                .voucher-card .corner-tl {
                    top: 0;
                    left: 0;
                    border-style: solid;
                    border-width: 70px 70px 0 0;
                    border-color: #16305c transparent transparent transparent;
                }
                .voucher-card .corner-br {
                    bottom: 0;
                    right: 0;
                    border-style: solid;
                    border-width: 0 0 70px 70px;
                    border-color: transparent transparent #16305c transparent;
                }
                .voucher-card .corner-accent {
                    position: absolute;
                    width: 0;
                    height: 0;
                    z-index: 1;
                    opacity: 0.85;
                }
                .voucher-card .corner-tl-accent {
                    top: 0;
                    left: 0;
                    border-style: solid;
                    border-width: 46px 46px 0 0;
                    border-color: #d4af37 transparent transparent transparent;
                }
                .voucher-card .corner-br-accent {
                    bottom: 0;
                    right: 0;
                    border-style: solid;
                    border-width: 0 0 46px 46px;
                    border-color: transparent transparent #d4af37 transparent;
                }

                .voucher-card .card-left {
                    position: relative;
                    z-index: 2;
                    width: 340px;
                    padding: 40px 32px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;
                }

                .voucher-card .brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .voucher-card .brand-mark {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, #f6e6b4, #cda434);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 17px;
                    color: #16305c;
                    border: 2px solid rgba(22, 48, 92, 0.25);
                }
                .voucher-card .brand-name {
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    max-width: 220px;
                }
                .voucher-card .brand-tag {
                    font-size: 10px;
                    font-style: italic;
                    color: #b8902a;
                    letter-spacing: 1px;
                }

                .voucher-card .gift-title-line1 {
                    font-size: 24px;
                    font-weight: 400;
                    letter-spacing: 6px;
                }
                .voucher-card .gift-title-line2 {
                    font-size: 40px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    margin-top: -2px;
                }

                .voucher-card .amount-watermark {
                    font-size: 44px;
                    font-weight: 800;
                    letter-spacing: 1px;
                    color: rgba(201, 162, 39, 0.4);
                }

                .voucher-card .card-divider {
                    position: relative;
                    z-index: 2;
                    width: 2px;
                    margin: 30px 0;
                    background: repeating-linear-gradient(
                        to bottom,
                        #c9a227 0,
                        #c9a227 6px,
                        transparent 6px,
                        transparent 12px
                    );
                }

                .voucher-card .card-right {
                    position: relative;
                    z-index: 2;
                    flex: 1;
                    padding: 34px 36px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .voucher-card .qr-block {
                    position: absolute;
                    top: 22px;
                    right: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 8px;
                    border: 2px dashed rgba(22, 48, 92, 0.35);
                    border-radius: 10px;
                    background: #fff;
                }
                .voucher-card .qr-block span {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: #16305c;
                }

                .voucher-card .fields {
                    margin-top: 100px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .voucher-card .field-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1px;
                    color: #8a6d1f;
                }
                .voucher-card .field-value {
                    font-size: 19px;
                    font-weight: 700;
                }
                .voucher-card .field-value.mono {
                    font-family: "Courier New", monospace;
                    letter-spacing: 1px;
                }
                .voucher-card .field-sub {
                    font-size: 12px;
                    font-weight: 400;
                    color: #555;
                }

                .voucher-card .redeemable {
                    margin-top: 8px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    text-align: center;
                }
                .voucher-card .terms {
                    font-size: 10px;
                    font-style: italic;
                    color: #8a6d1f;
                    text-align: center;
                }

                .voucher-card .card-footer {
                    position: absolute;
                    z-index: 2;
                    left: 340px;
                    right: 44px;
                    bottom: 22px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #6b6b6b;
                    border-top: 1px solid #d8c68a;
                    padding-top: 8px;
                }
            `}</style>

            <div className="print-toolbar no-print">
                <button type="button" className="btn-print" onClick={() => window.print()}>
                    Print
                </button>
                <button type="button" className="btn-close" onClick={() => onDone?.()}>
                    Close
                </button>
            </div>

            {vouchers.map((voucher, index) => {
                const qrDataUrl = buildQrDataUrl(String(voucher.voucherCode), QR_SIZE_PX);
                const amount = voucher.amount ?? 0;
                const issuedDate = voucher.createdAt || new Date().toISOString();
                // Valid for exactly one year (365 days) from the created/issued date.
                const validUntil = addDays(issuedDate, VALIDITY_DAYS);

                return (
                    <div
                        key={voucher.id}
                        className="voucher-qr-page"
                        style={{
                            width: `${PAGE_WIDTH_PX}px`,
                            height: `${PAGE_HEIGHT_PX}px`,
                            pageBreakAfter: index < vouchers.length - 1 ? "always" : "auto",
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div className="voucher-card">
                            {/* diagonal gold/navy lattice texture, behind everything */}
                            <span className="lattice-bg" />

                            <span className="corner corner-tl" />
                            <span className="corner-accent corner-tl-accent" />
                            <span className="corner corner-br" />
                            <span className="corner-accent corner-br-accent" />

                            <div className="card-left">
                                <div className="brand">
                                    <span className="brand-mark">{companyInitial}</span>
                                    <div>
                                        <div className="brand-name">{companyName}</div>
                                        <div className="brand-tag">Premium Voucher</div>
                                    </div>
                                </div>

                                <div className="gift-title">
                                    <div className="gift-title-line1">GIFT</div>
                                    <div className="gift-title-line2">VOUCHER</div>
                                </div>

                                <div className="amount-watermark">{formatRupees(amount, false)}</div>
                            </div>

                            <div className="card-divider" />

                            <div className="card-right">
                                <div className="qr-block">
                                    <img src={qrDataUrl} alt={`QR ${voucher.voucherCode}`} width={QR_SIZE_PX} height={QR_SIZE_PX} />
                                    <span>Scan Me</span>
                                </div>

                                <div className="fields">
                                    <div className="field">
                                        <div className="field-label">NAME:</div>
                                        <div className="field-value">{voucher.introducerName || "-"}</div>
                                    </div>
                                    <div className="field">
                                        <div className="field-label">CODE:</div>
                                        <div className="field-value mono">{voucher.voucherCode}</div>
                                    </div>
                                    <div className="field">
                                        <div className="field-label">AMOUNT:</div>
                                        <div className="field-value">
                                            {formatRupees(amount, true)}{" "}
                                            <span className="field-sub">({amountToRupeeWords(amount)})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="redeemable">REDEEMABLE AT ALL PARTICIPATING OUTLETS</div>
                                <div className="terms">Terms &amp; Conditions Apply</div>
                            </div>

                            <div className="card-footer">
                                <span>Valid Until: {formatDate(validUntil)}</span>
                                <span>Issued Date: {formatDate(issuedDate)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VoucherQrPrint;