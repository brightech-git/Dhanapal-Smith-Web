import { EXPORT_COLORS, exportFileName, isTotalRow, type ExportDoc, type ExportOptions } from "./export-doc";

// Excel download (exceljs): title, filters, optional summary, grouped header,
// rows with the same shading as the print, numbers stored as numbers, and the
// print date/time and user under the table.

const NUMBER = /^-?\d+(\.\d+)?$/;

const fill = (hex: string) => ({ type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: `FF${hex}` } });

export async function downloadExportExcel(doc: ExportDoc, o: ExportOptions) {
    const { Workbook } = await import("exceljs");
    const c = EXPORT_COLORS;
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Report", {
        pageSetup: { paperSize: 9, orientation: o.landscape ? "landscape" : "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });
    const cols = doc.columns;
    const n = Math.max(cols.length, 1);
    const thin = { style: "thin" as const, color: { argb: "FF999999" } };
    const borderAll = o.borders ? { top: thin, left: thin, bottom: thin, right: thin } : {};
    const toneFill = (tone?: string) => (o.colors && tone ? fill(tone === "receipt" ? c.receipt : c.issue) : undefined);
    const headFill = fill(o.colors ? c.head : c.headPlain);

    const merged = (text: string, font: Partial<{ bold: boolean; size: number; color: { argb: string } }>, align: "left" | "center" = "center") => {
        const row = sheet.addRow([text]);
        if (n > 1) sheet.mergeCells(row.number, 1, row.number, n);
        row.getCell(1).font = font;
        row.getCell(1).alignment = { horizontal: align, wrapText: true };
        return row;
    };

    for (const line of doc.title.trim().split("\n").filter(Boolean)) {
        merged(line, { bold: true, size: 14, ...(o.colors ? { color: { argb: `FF${c.title}` } } : {}) });
    }
    if (o.showFilters && doc.filters) merged(doc.filters, { size: 9 });

    if (o.showSummary && doc.summary?.rows.length) {
        sheet.addRow([]);
        const head = sheet.addRow(["", ...doc.summary.columns]);
        head.eachCell((cell) => { cell.font = { bold: true }; cell.fill = headFill; cell.border = borderAll; });
        for (const r of doc.summary.rows) {
            const row = sheet.addRow([r.label, ...r.cells.map((v) => (NUMBER.test(v) ? Number(v) : v))]);
            row.eachCell((cell, index) => {
                cell.border = borderAll;
                const f = toneFill(r.tone);
                if (f) cell.fill = f;
                if (index === 1) cell.font = { bold: true };
                else cell.alignment = { horizontal: "right" };
            });
        }
    }
    sheet.addRow([]);

    // Header (two rows when columns are grouped).
    const hasGroups = cols.some((col) => col.group);
    const styleHead = (rowNumber: number) => {
        sheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell, index) => {
            const col = cols[index - 1];
            if (!col) return;
            cell.font = { bold: o.boldHeadings, ...(o.colors && col.group && rowNumber !== sheet.rowCount ? { color: { argb: `FF${c.group}` } } : {}) };
            cell.fill = toneFill(col.tone) ?? headFill;
            cell.border = borderAll;
            cell.alignment = { horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left", vertical: "middle" };
        });
    };
    if (hasGroups) {
        const top = sheet.addRow(cols.map((col) => col.group ?? col.label));
        const sub = sheet.addRow(cols.map((col) => (col.group ? col.label : "")));
        cols.forEach((col, i) => {
            if (!col.group) sheet.mergeCells(top.number, i + 1, sub.number, i + 1);
            else if (cols[i - 1]?.group !== col.group) {
                let span = 0;
                while (cols[i + span]?.group === col.group) span++;
                if (span > 1) sheet.mergeCells(top.number, i + 1, top.number, i + span);
            }
        });
        styleHead(top.number);
        styleHead(sub.number);
        cols.forEach((col, i) => { if (col.group) top.getCell(i + 1).alignment = { horizontal: "center" }; });
    } else {
        const head = sheet.addRow(cols.map((col) => col.label));
        styleHead(head.number);
    }

    for (const r of doc.rows) {
        if (r.kind === "section" || r.kind === "subsection") {
            const section = r.kind === "section";
            const row = merged(r.label ?? "", {
                bold: true,
                ...(o.colors ? { color: { argb: `FF${section ? c.section : c.group}` } } : {}),
            }, "left");
            if (!section) row.getCell(1).alignment = { horizontal: "left", indent: 2 };
            continue;
        }
        const total = isTotalRow(r.kind);
        const totalFill = r.kind === "grand" ? (o.colors ? c.grand : c.grandPlain)
            : r.kind === "total" ? (o.colors ? c.total : c.totalPlain) : (o.colors ? c.subtotal : c.subtotalPlain);
        const row = sheet.addRow(cols.map((col) => {
            const value = r.cells?.[col.key] ?? "";
            return col.numeric && NUMBER.test(value) ? Number(value) : value;
        }));
        cols.forEach((col, i) => {
            const cell = row.getCell(i + 1);
            const value = r.cells?.[col.key] ?? "";
            if (col.numeric && NUMBER.test(value)) cell.numFmt = value.includes(".") ? `0.${"0".repeat(value.split(".")[1].length)}` : "0";
            cell.alignment = { horizontal: col.align === "right" ? "right" : col.align === "center" ? "center" : "left" };
            cell.border = borderAll;
            const f = total ? fill(totalFill) : toneFill(col.tone);
            if (f) cell.fill = f;
            if (total) cell.font = { bold: true };
        });
    }

    // Who printed it and when.
    const footer = [
        o.printDateTime ? `Printed on ${doc.printedAt}` : "",
        o.printUser && doc.userName ? `User : ${doc.userName}` : "",
    ].filter(Boolean).join("     ");
    if (footer) {
        sheet.addRow([]);
        merged(footer, { bold: true, size: 9 }, "left");
    }

    cols.forEach((col, i) => {
        const longest = Math.max(col.label.length, col.group && n === 1 ? col.group.length : 0,
            ...doc.rows.filter((r) => r.cells).map((r) => (r.cells?.[col.key] ?? "").length));
        sheet.getColumn(i + 1).width = Math.min(45, Math.max(8, longest + 2));
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName(doc.title)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
