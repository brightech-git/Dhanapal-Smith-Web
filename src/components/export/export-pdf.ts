import { EXPORT_COLORS, exportFileName, isTotalRow, type ExportDoc, type ExportOptions, type ExportRow } from "./export-doc";

// PDF download (jsPDF, A4). Same layout as the print page: title, filters,
// optional totals summary, grouped header, shaded receipt / issue columns,
// and on every page a footer with print date/time, "x of y" and the user.

const FONT_PT = { small: 7, normal: 8.5, large: 10 } as const;
const MARGIN = 10;
const FOOTER = 8;
const PAD_X = 1.2;
const PAD_Y = 1;

const rgb = (hex: string): [number, number, number] =>
    [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];

export async function downloadExportPdf(doc: ExportDoc, o: ExportOptions) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: o.landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const avail = pageW - MARGIN * 2;
    const bottom = pageH - MARGIN - FOOTER;
    const c = EXPORT_COLORS;
    const cols = doc.columns;
    const hasGroups = cols.some((col) => col.group);
    const dataRows = doc.rows.filter((r) => r.kind !== "section" && r.kind !== "subsection");

    // Column widths: widest header or value, shrinking the font until they fit.
    let font: number = FONT_PT[o.fontSize];
    const measure = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(font);
        return cols.map((col) => Math.max(
            pdf.getTextWidth(col.label),
            ...dataRows.map((r) => pdf.getTextWidth(r.cells?.[col.key] ?? "")),
        ) + PAD_X * 2 + 0.5);
    };
    let widths = measure();
    while (widths.reduce((s, w) => s + w, 0) > avail && font > 5.5) {
        font -= 0.5;
        widths = measure();
    }
    const natural = widths.reduce((s, w) => s + w, 0);
    if (natural > avail) {
        widths = widths.map((w) => (w * avail) / natural);
    } else {
        // Spread the spare width over the text columns (all columns when there are none).
        const textCols = cols.filter((col) => col.align !== "right").length;
        const extra = avail - natural;
        widths = widths.map((w, i) => w + (textCols ? (cols[i].align !== "right" ? extra / textCols : 0) : extra / cols.length));
    }
    const xs = widths.reduce<number[]>((acc, w, i) => [...acc, (acc[i] ?? MARGIN) + w], [MARGIN]);
    const rowH = font * 0.3528 * 1.25 + PAD_Y * 2;
    let y = MARGIN;

    const fit = (text: string, width: number) => {
        const lines = pdf.splitTextToSize(text, Math.max(1, width - PAD_X * 2)) as string[];
        return lines[0] ?? "";
    };
    const cell = (x: number, w: number, h: number, text: string, opts: { fill?: string; bold?: boolean; align?: string; color?: [number, number, number] } = {}) => {
        if (opts.fill) {
            pdf.setFillColor(...rgb(opts.fill));
            pdf.rect(x, y, w, h, "F");
        }
        if (o.borders) {
            pdf.setDrawColor(140);
            pdf.setLineWidth(0.15);
            pdf.rect(x, y, w, h, "S");
        }
        pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
        pdf.setFontSize(font);
        pdf.setTextColor(...(opts.color ?? [0, 0, 0]));
        const align = opts.align === "right" ? "right" : opts.align === "center" ? "center" : "left";
        const tx = align === "right" ? x + w - PAD_X : align === "center" ? x + w / 2 : x + PAD_X;
        pdf.text(fit(text, w), tx, y + h / 2 + font * 0.3528 * 0.35, { align });
    };

    const toneFill = (tone?: string) => (o.colors && tone ? (tone === "receipt" ? c.receipt : c.issue) : undefined);
    const headFill = o.colors ? c.head : c.headPlain;

    const drawHeader = () => {
        const bold = o.boldHeadings;
        if (hasGroups) {
            cols.forEach((col, i) => {
                if (!col.group) {
                    const saved = y;
                    cell(xs[i], widths[i], rowH * 2, col.label, { fill: headFill, bold, align: col.align });
                    y = saved;
                    return;
                }
                if (cols[i - 1]?.group === col.group) return;
                let span = 0, w = 0;
                while (cols[i + span]?.group === col.group) { w += widths[i + span]; span++; }
                cell(xs[i], w, rowH, col.group, { fill: toneFill(col.tone) ?? headFill, bold, align: "center", color: o.colors ? rgb(c.group) : undefined });
            });
            y += rowH;
            cols.forEach((col, i) => {
                if (col.group) cell(xs[i], widths[i], rowH, col.label, { fill: toneFill(col.tone) ?? headFill, bold, align: col.align });
            });
            y += rowH;
        } else {
            cols.forEach((col, i) => cell(xs[i], widths[i], rowH, col.label, { fill: headFill, bold, align: col.align }));
            y += rowH;
        }
        if (!o.borders) {
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.3);
            pdf.line(MARGIN, y, MARGIN + avail, y);
        }
    };

    const newPage = () => {
        pdf.addPage();
        y = MARGIN;
        if (o.repeatHeader) drawHeader();
    };
    const ensure = (h: number) => { if (y + h > bottom) newPage(); };

    // Title, filters and summary on the first page.
    const title = doc.title.trim();
    if (title) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(font + 4);
        pdf.setTextColor(...(o.colors ? rgb(c.title) : [0, 0, 0] as [number, number, number]));
        for (const line of title.split("\n")) {
            pdf.text(line, pageW / 2, y + 4, { align: "center" });
            y += (font + 4) * 0.3528 * 1.4;
        }
        y += 1;
    }
    if (o.showFilters && doc.filters) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(font - 0.5);
        pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(doc.filters, avail) as string[];
        lines.forEach((line) => { pdf.text(line, pageW / 2, y + 3, { align: "center" }); y += 3.6; });
        y += 1.5;
    }
    if (o.showSummary && doc.summary?.rows.length) {
        const s = doc.summary;
        const w0 = 28, w = 26;
        const total = w0 + w * s.columns.length;
        const left = (pageW - total) / 2;
        const saveBorders = o.borders;
        o = { ...o, borders: true };
        cell(left, w0, rowH, "", { fill: headFill, bold: true });
        s.columns.forEach((h, i) => cell(left + w0 + w * i, w, rowH, h, { fill: headFill, bold: true, align: "right" }));
        y += rowH;
        for (const r of s.rows) {
            const fill = toneFill(r.tone);
            cell(left, w0, rowH, r.label, { fill, bold: true });
            r.cells.forEach((v, i) => cell(left + w0 + w * i, w, rowH, v, { fill, align: "right" }));
            y += rowH;
        }
        o = { ...o, borders: saveBorders };
        y += 3;
    }

    drawHeader();
    const totalFill = (row: ExportRow) =>
        row.kind === "grand" ? (o.colors ? c.grand : c.grandPlain)
            : row.kind === "total" ? (o.colors ? c.total : c.totalPlain)
                : (o.colors ? c.subtotal : c.subtotalPlain);

    for (const row of doc.rows) {
        ensure(rowH);
        if (row.kind === "section" || row.kind === "subsection") {
            const section = row.kind === "section";
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(section ? font + 0.5 : font);
            pdf.setTextColor(...(o.colors ? rgb(section ? c.section : c.group) : [0, 0, 0] as [number, number, number]));
            if (o.borders) {
                pdf.setDrawColor(140);
                pdf.setLineWidth(0.15);
                pdf.rect(MARGIN, y, avail, rowH, "S");
            }
            pdf.text(row.label ?? "", MARGIN + PAD_X + (section ? 0 : 5), y + rowH / 2 + font * 0.3528 * 0.35);
            y += rowH;
            continue;
        }
        const total = isTotalRow(row.kind);
        cols.forEach((col, i) => cell(xs[i], widths[i], rowH, row.cells?.[col.key] ?? "", {
            fill: total ? totalFill(row) : toneFill(col.tone),
            bold: total,
            align: col.align,
        }));
        if (row.kind === "grand") {
            pdf.setDrawColor(0);
            pdf.setLineWidth(0.4);
            pdf.line(MARGIN, y, MARGIN + avail, y);
        }
        y += rowH;
    }

    // Footer on every page.
    const pages = pdf.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0);
        const fy = pageH - MARGIN + 2;
        if (o.printDateTime) pdf.text(doc.printedAt, MARGIN, fy);
        if (o.pageNumbers) pdf.text(`${page} of ${pages}`, pageW / 2, fy, { align: "center" });
        if (o.printUser && doc.userName) pdf.text(`User : ${doc.userName}`, pageW - MARGIN, fy, { align: "right" });
    }
    pdf.save(`${exportFileName(doc.title)}.pdf`);
}
