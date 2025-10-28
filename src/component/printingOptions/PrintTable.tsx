"use client";

import React, { useRef, useMemo } from "react";
import { Printer } from "lucide-react";

interface ColumnDef<T> {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    headalign?: "left" | "center" | "right";
    render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface PrintTableProps<T> {
    title: string;
    subtitle?: string;
    columns: ColumnDef<T>[];
    data: T[];
}

const PrintTable = <T extends Record<string, any>>({
    title,
    subtitle,
    columns,
    data,
}: PrintTableProps<T>) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContents = printRef.current?.innerHTML;
        if (!printContents) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #555; padding: 6px; }
            th { background: #eee; text-align: center; }
            td { vertical-align: middle; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .footer td { font-weight: bold; background: #f2f2f2; }
            .header { text-align: center; margin-bottom: 10px; }
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

    // ✅ Dynamic totals computation
    const totals = useMemo(() => {
        if (!data?.length) return {};

        // Detect table type
        const hasWeightBalance = data.some((d) => "weightBalance" in d);
        const hasCashBalance = data.some((d) => "cashBalance" in d);
        const hasReceipts = data.some((d) => "receipts" in d);
        const hasPayments = data.some((d) => "payments" in d);

        const result: Record<string, number> = {};

        if (hasWeightBalance || hasCashBalance) {
            // Main Table
            result.weightBalance = data.reduce((sum, d) => sum + (d.weightBalance || 0), 0);
            result.cashBalance = data.reduce((sum, d) => sum + (d.cashBalance || 0), 0);
        } else if (hasReceipts || hasPayments) {
            // Cash / Weight table
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
            {/* Print Button */}
            <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 transition"
                title="Print Report"
            >
                <Printer className="w-6 h-6" />
            </button>

            {/* Hidden Printable Content */}
            <div ref={printRef} style={{ display: "none" }}>
                <div className="header" style={{ textAlign: "center", marginBottom: "10px" }}>
                    <h1 style={{ fontSize: "18px", fontWeight: "bold" }}>{title}</h1>
                    {/* {subtitle && <p style={{ fontSize: "12px" }}>{subtitle}</p>} */}
                    <p style={{ fontSize: "10px", color: "#555" }}>
                        Printed on: {formattedDate} {formattedTime}
                    </p>
                </div>

                <table>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} style={{ textAlign: col.headalign || "center" }}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((col) => (
                                    <td key={col.key} style={{ textAlign: col.align || "left" }}>
                                        {col.render
                                            ? col.render(row[col.key], row, rowIndex)
                                            : row[col.key] ?? ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>

                    {/* ✅ Totals Section */}
                    <tfoot>
                        <tr className="footer">
                            {/* Label cell */}
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
                                                "remarks", // exclude remarks so Total label spans correctly
                                            ].includes(col.key)
                                    ).length
                                }
                                style={{ textAlign: "right", fontWeight: "bold" }}
                            >
                                Total
                            </td>

                            {/* Totals */}
                            {columns.map((col, index) => {
                                if (col.key === "weightBalance")
                                    return (
                                        <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                                            {totals.weightBalance?.toFixed(3)}
                                        </td>
                                    );
                                if (col.key === "cashBalance")
                                    return (
                                        <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                                            {totals.cashBalance?.toFixed(2)}
                                        </td>
                                    );
                                if (col.key === "receipts")
                                    return (
                                        <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                                            {totals.receipts?.toFixed(3)}
                                        </td>
                                    );
                                if (col.key === "payments")
                                    return (
                                        <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                                            {totals.payments?.toFixed(3)}
                                        </td>
                                    );
                                if (col.key === "balance")
                                    return (
                                        <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                                            {totals.balance?.toFixed(3)}
                                        </td>
                                    );

                                // ✅ Add an empty cell before "remarks"
                                if (col.key === "remarks")
                                    return <td key={col.key}></td>;

                                return null;
                            })}
                        </tr>
                    </tfoot>


                </table>
            </div>
        </div>
    );
};

export default PrintTable;
