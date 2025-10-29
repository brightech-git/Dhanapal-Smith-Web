"use client";

import React, { useRef, useMemo } from "react";
import { Printer } from "lucide-react";

interface ColumnDef<T> {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    headalign?: "left" | "center" | "right";
    render?: (value: any, row: T, index: number) => React.ReactNode;
    headSize?: "sm" | "md" | "lg" | string; // support numeric or string px
    bodySize?: "sm" | "md" | "lg" | string;
}

interface PrintTableProps<T> {
    title: string;
    subtitle?: string;
    showTotal?: boolean;
    columns: ColumnDef<T>[];
    data: T[];
}

const getFontSize = (size?: string) => {
    if (!size) return "12px";
    if (size === "sm") return "10px";
    if (size === "md") return "12px";
    if (size === "lg") return "14px";
    // if user passes custom (e.g. "11px" or "0.8rem")
    return size;
};

const PrintTable = <T extends Record<string, any>>({
    title,
    subtitle,
    showTotal,
    columns,
    data,
}: PrintTableProps<T>) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML;
        if (!printContents) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        // Build per-column dynamic CSS
        const columnFontStyles = columns
            .map(
                (col, i) => `
                th:nth-child(${i + 1}) { font-size: ${getFontSize(col.headSize)}; }
                td:nth-child(${i + 1}) { font-size: ${getFontSize(col.bodySize)}; }
            `
            )
            .join("\n");

        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        @page { size: A4; margin: 20mm; }

                        body { 
                            font-family: Arial, sans-serif; 
                            font-size: 12px; 
                            color: #000; 
                        }

                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 10px; 
                        }

                        th, td { 
                            border: 1px solid #555; 
                            padding: 5px; 
                            vertical-align: middle; 
                        }

                        th { 
                            background: #eee; 
                            text-align: center; 
                        }

                        .text-right { text-align: right; }
                        .text-left { text-align: left; }
                        .text-center { text-align: center; }

                        .footer td { 
                            font-weight: bold; 
                            background: #f2f2f2; 
                        }

                        .header { 
                            text-align: center; 
                            margin-bottom: 8px; 
                        }

                        .header h1 { font-size: 16px; font-weight: bold; margin: 0; }
                        .header p { font-size: 10px; color: #555; margin: 2px 0; }

                        /* Dynamic column-based font sizes */
                        ${columnFontStyles}
                    </style>
                </head>
                <body>${printContents}</body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN");
    const formattedTime = now.toLocaleTimeString("en-IN");

    // ✅ Compute totals dynamically
    const totals = useMemo(() => {
        if (!data?.length) return {};

        const hasWeightBalance = data.some((d) => "weightBalance" in d);
        const hasCashBalance = data.some((d) => "cashBalance" in d);
        const hasReceipts = data.some((d) => "receipts" in d);
        const hasPayments = data.some((d) => "payments" in d);

        const result: Record<string, number> = {};

        if (hasWeightBalance || hasCashBalance) {
            result.weightBalance = data.reduce((sum, d) => sum + (d.weightBalance || 0), 0);
            result.cashBalance = data.reduce((sum, d) => sum + (d.cashBalance || 0), 0);
        } else if (hasReceipts || hasPayments) {
            const totalReceipts = data.reduce((sum, d) => sum + (parseFloat(d.receipts) || 0), 0);
            const totalPayments = data.reduce((sum, d) => sum + (parseFloat(d.payments) || 0), 0);
            result.receipts = totalReceipts;
            result.payments = totalPayments;
            result.balance = totalReceipts - totalPayments;
        }

        return result;
    }, [data]);

    return (
        <div>
            {/* 🖨️ Print button */}
            <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 transition"
                title="Print Report"
            >
                <Printer className="w-6 h-6" />
            </button>

            {/* Hidden Printable Section */}
            <div ref={printRef} style={{ display: "none" }}>
                <div className="header">
                    <h1>{title}</h1>
                    {subtitle && <p>{subtitle}</p>}
                    <p>Printed on: {formattedDate} {formattedTime}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        textAlign: col.headalign || "center",
                                        fontSize: getFontSize(col.headSize),
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        style={{
                                            textAlign: col.align || "left",
                                            fontSize: getFontSize(col.bodySize),
                                        }}
                                    >
                                        {col.render
                                            ? col.render(row[col.key], row, rowIndex)
                                            : row[col.key] ?? ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>

                    {/* ✅ Totals Row */}
                    {showTotal && (
                        <tfoot>
                            <tr className="footer">
                                <td
                                    colSpan={
                                        columns.filter(
                                            (col) =>
                                                ![
                                                    "weightBalance",
                                                    "cashBalance",
                                                    "receipts",
                                                    "payments",
                                                    "balance",
                                                    "remarks",
                                                ].includes(col.key)
                                        ).length
                                    }
                                    style={{ textAlign: "right", fontWeight: "bold" }}
                                >
                                    Total
                                </td>

                                {columns.map((col) => {
                                    const alignStyle = { textAlign: "right" as const, fontWeight: "bold" };
                                    if (col.key === "weightBalance")
                                        return <td key={col.key} style={alignStyle}>{totals.weightBalance?.toFixed(3)}</td>;
                                    if (col.key === "cashBalance")
                                        return <td key={col.key} style={alignStyle}>{totals.cashBalance?.toFixed(2)}</td>;
                                    if (col.key === "receipts")
                                        return <td key={col.key} style={alignStyle}>{totals.receipts?.toFixed(3)}</td>;
                                    if (col.key === "payments")
                                        return <td key={col.key} style={alignStyle}>{totals.payments?.toFixed(3)}</td>;
                                    if (col.key === "balance")
                                        return <td key={col.key} style={alignStyle}>{totals.balance?.toFixed(3)}</td>;
                                    if (col.key === "remarks") return <td key={col.key}></td>;
                                    return null;
                                })}
                            </tr>
                        </tfoot>
                    )}
                   
                </table>
            </div>
        </div>
    );
};

export default PrintTable;
