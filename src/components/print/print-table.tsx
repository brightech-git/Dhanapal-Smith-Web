"use client";

import React, { useRef, useMemo, useState } from "react";
import { sumWeights } from "@/src/module/smith/lib/weight-calc";
import { flushSync } from "react-dom";
import { getApiErrorMessage } from "@/lib/api/envelope";
import { useToast } from "@/src/providers/toast-provider";
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
    main?: boolean;
    showTotal?: boolean;
    columns: ColumnDef<T>[];
    getPrintData: () => Promise<T[]>;
    smithName ?:string;
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
    main,
    columns,
    getPrintData,
    smithName ,

}: PrintTableProps<T>) => {
    const [data, setData] = useState<T[]>([]);
    const [printing, setPrinting] = useState(false);
    const busy = useRef(false);
    const { addToast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);

    const columnsToUse = showTotal === false
        ? columns.map((col) => {
            console.log(col.key, 'col.key')
            // You can customize the header label here for "short" names
            const shortLabels: Record<string, string> = {
                smith: "Smith",
                weightBalance: "W/B",
                cashBalance: "Mc/B",
            };
            return {
                ...col,
                label: shortLabels[col.key] || col.label,
            };
        })
        : columns;
    const tableStyle: React.CSSProperties = {
        width: showTotal === false ? "auto" : "100%", // auto width if showTotal is false
        tableLayout: "auto",
        borderCollapse: "collapse",
        marginTop: 10,
    };
    const headerStyle: React.CSSProperties = {
        textAlign: showTotal === false ? "left" : "center",
        fontSize: showTotal === false ? "0.85rem" : "1rem", // smaller if showTotal is false
        marginBottom: 10,
    };

    const titleStyle: React.CSSProperties = {
        fontSize: showTotal === false ? "1rem" : "1.5rem",
        margin: 0,
    };

    const subtitleStyle: React.CSSProperties = {
        fontSize: showTotal === false ? "0.85rem" : "1rem",
        margin: 0,
    };
    const handlePrint = async () => {
        if (busy.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            addToast({ type: "error", title: "Printing blocked", message: "Allow pop-ups to print this report." });
            return;
        }
        busy.current = true;
        setPrinting(true);
        try {
            const records = await getPrintData();
            if (printWindow.closed) return;
            flushSync(() => setData(records));
            const printContents = printRef.current?.innerHTML;
            if (!printContents) throw new Error("Unable to prepare the print report");

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
  <head >
   <style>
  @page { size: A4; margin: 10mm; }

  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #000;
    -webkit-print-color-adjust: exact; /* Force background colors in Chrome/Safari */
    print-color-adjust: exact;         /* Standard property for other browsers */
  }

  table {
    border-collapse: collapse;
    margin-top: 10px;
  }

  th, td {
    border: 1px solid #555;
    padding: 5px;
    vertical-align: middle;
  }

  th {
    background-color: #ddd; /* green background */
    color: black !important;
    text-align: center;
  }

  td {
    background-color: #f9f9f9 !important; /* light gray */
  }

  .footer td {
    background-color: #ddd !important;
    font-weight: bold;
    color:red !important; 

  }
     /* ✅ Show header every page, totals only at end */
  @media print {
    thead { display: table-header-group; }
    tfoot { display: table-row-group; }
  }

  /* Dynamic column font sizes */
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
        } catch (error) {
            printWindow.close();
            addToast({ type: "error", title: "Could not print", message: getApiErrorMessage(error) });
        } finally {
            busy.current = false;
            setPrinting(false);
        }
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

        const result: Record<string, number> = {
            grswt: sumWeights(data.map((row) => row.grswt)),
        };

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

    const totalColumns = ["grswt", "weightBalance", "cashBalance", "receipts", "payments", "balance"];
    const firstTotalColumn = columnsToUse.findIndex((column) => totalColumns.includes(column.key));
    const totalLabelSpan = firstTotalColumn < 0 ? columnsToUse.length : firstTotalColumn;

    return (
        <div>
            {/* 🖨️ Print button */}
            <button
                type="button"
                disabled={printing}
                aria-label={printing ? "Loading saved print records" : "Print report"}
                aria-busy={printing}
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 text-gray-700 hover:text-blue-600 transition"
                title={printing ? "Loading saved records…" : "Print Report"}
            >
                <Printer className="w-6 h-6" />
            </button>

            {/* Hidden Printable Section */}
            <div ref={printRef} style={{ display: "none" }}>

                {/* <div className="header" style={headerStyle}>
                    <h1 style={titleStyle}>{title}</h1>
                    {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
                    <p style={{ fontSize: showTotal === false ? "0.75rem" : "0.9rem", margin: 0 }}>
                        Printed on: {formattedDate} {formattedTime}
                    </p>
                </div> */}

                 <div className="header" style={headerStyle}>
                    
                    {smithName && <h1 style={titleStyle}>{smithName}</h1>}
                  
                </div> 

                <table style={tableStyle}>
                    <thead>
                        <tr>
                            {columnsToUse.map((col) => (
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
                                {columnsToUse.map((col) => (
                                    <td
                                        key={col.key}
                                        style={{
                                            textAlign: col.align || "left",
                                            fontSize: getFontSize(col.bodySize),
                                        }}
                                    >
                                        {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key] ?? ""}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>


                    {/* ✅ Totals Row */}
                    {(showTotal || main) && (
                        <tfoot>
                            <tr className="footer">
                                {totalLabelSpan > 0 && (
                                    <td colSpan={totalLabelSpan} style={{ textAlign: "right", fontWeight: "bold" }}>Total</td>
                                )}
                                {columnsToUse.slice(totalLabelSpan).map((col) => (
                                    <td key={col.key} style={{ textAlign: "right", fontWeight: "bold" }}>
                                        {totalColumns.includes(col.key) && totals[col.key] !== undefined
                                            ? totals[col.key].toFixed(col.key === "cashBalance" ? 2 : 3)
                                            : ""}
                                    </td>
                                ))}
                            </tr>
                        </tfoot>
                    )}
                   
                </table>
            </div>
        </div>
    );
};

export default PrintTable;
