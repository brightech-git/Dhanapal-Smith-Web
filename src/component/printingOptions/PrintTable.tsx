"use client";

import React, { useRef } from "react";
import { Printer } from "lucide-react";

type SmithRecord = {
    id: number;
    smithId: string;
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number;
};

interface PrintTableProps {
    title: string;
    subtitle?: string;
    data: SmithRecord[];
}

const PrintTable: React.FC<PrintTableProps> = ({ title, subtitle, data }) => {
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

    const totalWeight = data.reduce((sum, d) => sum + (d.weightBalance || 0), 0);
    const totalCash = data.reduce((sum, d) => sum + (d.cashBalance || 0), 0);

    return (
        <div>
            {/* 👇 Only the print icon is visible on the page */}
            <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 transition"
                title="Print Report"
            >
                <Printer className="w-6 h-6" />
            </button>

            {/* 👇 Hidden printable content */}
            <div ref={printRef} style={{ display: "none" }}>
                <div className="header" style={{ textAlign: "center", marginBottom: "10px" }}>
                    <h1 style={{ fontSize: "18px", fontWeight: "bold" }}>{title}</h1>
                    {subtitle && <p style={{ fontSize: "12px" }}>{subtitle}</p>}
                    <p style={{ fontSize: "10px", color: "#555" }}>
                        Printed on: {formattedDate} {formattedTime}
                    </p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th style={{ textAlign: "left" }}>Name</th>
                            <th style={{ textAlign: "right" }}>Weight Balance</th>
                            <th style={{ textAlign: "right" }}>Cash Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <tr key={item.id}>
                                <td style={{ textAlign: "center" }}>{i + 1}</td>
                                <td style={{ textAlign: "left" }}>{item.name}</td>
                                <td style={{ textAlign: "right" }}>{item.weightBalance.toFixed(3)}</td>
                                <td style={{ textAlign: "right" }}>{item.cashBalance.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="footer">
                            <td colSpan={2} style={{ textAlign: "right", fontWeight: "bold" }}>
                                Total
                            </td>
                            <td style={{ textAlign: "right", fontWeight: "bold" }}>
                                {totalWeight.toFixed(3)}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: "bold" }}>
                                {totalCash.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default PrintTable;
