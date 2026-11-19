export type ReportExportColumn = { label: string; align?: "left" | "right" | "center" };
export type ReportExportRow = { resultSet: number; cells: string[] };
export type ReportExportData = {
    title: string;
    subtitle?: string;
    columns: ReportExportColumn[];
    rows: ReportExportRow[];
};

const filename = (title: string) => title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "report";

export async function downloadReportPdf(report: ReportExportData, columnsAcross: 1 | 2) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ format: "a4", unit: "mm" });
    const margin = 10;
    const bottom = pdf.internal.pageSize.getHeight() - margin;
    const width = (pdf.internal.pageSize.getWidth() - margin * 2 - (columnsAcross - 1)) / columnsAcross;
    const padding = 1.2;
    const verticalPadding = 1;
    let fontSize = columnsAcross === 2 ? 7.5 : 9;

    // Measure in bold so headers and totals fit as well as ordinary data.
    const measureColumns = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(fontSize);
        return report.columns.map((column, index) => {
            const headerWidth = pdf.getTextWidth(column.label);
            const values = report.rows.map((row) => pdf.getTextWidth(row.cells[index] || ""));
            const aggregateValues = report.rows.filter((row) => row.resultSet !== 1)
                .map((row) => pdf.getTextWidth(row.cells[index] || ""));
            const minimum = Math.max(headerWidth, ...(column.align === "right" ? values : aggregateValues)) + padding * 2 + 0.5;
            const preferred = Math.max(minimum, Math.min(width * 0.4, Math.max(headerWidth, ...values) + padding * 2 + 0.5));
            return { minimum, preferred };
        });
    };
    let measured = measureColumns();
    while (measured.reduce((sum, column) => sum + column.minimum, 0) > width && fontSize > 6) {
        fontSize -= 0.5;
        measured = measureColumns();
    }
    const minimumTotal = measured.reduce((sum, column) => sum + column.minimum, 0);
    const preferredTotal = measured.reduce((sum, column) => sum + column.preferred, 0);
    const available = Math.max(0, width - minimumTotal);
    const requested = preferredTotal - minimumTotal;
    const widths = measured.map((column) => column.minimum +
        (requested > 0 ? (column.preferred - column.minimum) * Math.min(1, available / requested) : 0));
    const spare = Math.max(0, width - widths.reduce((sum, value) => sum + value, 0));
    const textColumns = report.columns.filter((column) => column.align !== "right").length;
    widths.forEach((value, index) => {
        if (!textColumns || report.columns[index].align !== "right") {
            widths[index] = value + spare / (textColumns || widths.length);
        }
    });
    const lineHeight = fontSize * 0.3528 * 1.15;
    let columnIndex = 0;
    let y = margin;
    let bodyTop = margin;

    const linesFor = (cells: string[]) => cells.map((cell, index) =>
        pdf.splitTextToSize(cell || " ", Math.max(1, widths[index] - padding * 2)) as string[]);

    const drawCells = (lines: string[][], height: number, resultSet: number, heading = false) => {
        let x = margin + columnIndex * (width + 1);
        const shade = heading || resultSet === 3 ? 220 : resultSet === 2 ? 240 : 255;
        pdf.setDrawColor(120);
        pdf.setLineWidth(0.15);
        lines.forEach((text, index) => {
            // Text drawing can change jsPDF's fill color, so set it for every cell.
            pdf.setFillColor(shade, shade, shade);
            pdf.rect(x, y, widths[index], height, "FD");
            const align = report.columns[index].align ?? "left";
            const textX = align === "right" ? x + widths[index] - padding : align === "center" ? x + widths[index] / 2 : x + padding;
            pdf.setTextColor(0, 0, 0);
            pdf.text(text, textX, y + verticalPadding + fontSize * 0.3528, { align, lineHeightFactor: 1.15 });
            x += widths[index];
        });
        y += height;
    };

    const startColumn = () => {
        y = bodyTop;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(fontSize);
        const lines = linesFor(report.columns.map((column) => column.label));
        drawCells(lines, Math.max(...lines.map((text) => text.length)) * lineHeight + verticalPadding * 2, 0, true);
    };

    const startPage = () => {
        columnIndex = 0;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(report.title, margin, margin + 4);
        y = margin + 8;
        if (report.subtitle) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8);
            const lines = pdf.splitTextToSize(report.subtitle, pdf.internal.pageSize.getWidth() - margin * 2) as string[];
            pdf.text(lines, margin, y);
            y += lines.length * 3.4 + 2;
        }
        bodyTop = y;
        startColumn();
    };

    const advance = () => {
        if (columnIndex + 1 < columnsAcross) {
            columnIndex++;
            startColumn();
        } else {
            pdf.addPage();
            startPage();
        }
    };

    startPage();
    for (const row of report.rows) {
        const bold = row.resultSet !== 1;
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(fontSize);
        const lines = linesFor(row.cells);
        const lineCount = Math.max(...lines.map((text) => text.length));
        if (y + lineCount * lineHeight + verticalPadding * 2 > bottom) advance();
        let offset = 0;
        while (offset < lineCount) {
            const capacity = Math.floor((bottom - y - verticalPadding * 2) / lineHeight);
            if (capacity < 1) { advance(); continue; }
            const count = Math.min(capacity, lineCount - offset);
            pdf.setFont("helvetica", bold ? "bold" : "normal");
            pdf.setFontSize(fontSize);
            drawCells(lines.map((text) => text.slice(offset, offset + count)), count * lineHeight + verticalPadding * 2, row.resultSet);
            offset += count;
            if (offset < lineCount) advance();
        }
    }
    pdf.save(`${filename(report.title)}.pdf`);
}

export async function downloadReportExcel(report: ReportExportData) {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Report");
    sheet.addRow([report.title]).font = { bold: true, size: 14 };
    if (report.subtitle) sheet.addRow([report.subtitle]);
    sheet.addRow([]);
    const header = sheet.addRow(report.columns.map((column) => column.label));
    header.font = { bold: true };
    for (const row of report.rows) {
        const values = row.cells.map((value, index) => {
            const numeric = value.replace(/,/g, "");
            return report.columns[index].align === "right" && /^-?\d+(\.\d+)?$/.test(numeric)
                ? Number(numeric) : value;
        });
        const excelRow = sheet.addRow(values);
        excelRow.font = { bold: row.resultSet !== 1 };
        excelRow.eachCell((cell, index) => {
            cell.alignment = { horizontal: report.columns[index - 1].align ?? "left" };
            if (typeof cell.value === "number") {
                const decimals = row.cells[index - 1].split(".")[1]?.length ?? 0;
                cell.numFmt = decimals ? `#,##0.${"0".repeat(decimals)}` : "#,##0";
            }
        });
    }
    report.columns.forEach((column, index) => { sheet.getColumn(index + 1).width = column.align === "right" ? 18 : 30; });
    sheet.views = [{ state: "frozen", ySplit: header.number }];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename(report.title)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
