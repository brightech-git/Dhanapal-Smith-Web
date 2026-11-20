// One description of a report table that Print, PDF and Excel all read, so the
// three outputs always match. Screens build an ExportDoc from their rows and
// hand it to <ExportDialog>, which asks what to include first.

export type ExportTone = "receipt" | "issue";

export type ExportColumn = {
    key: string;
    label: string;
    align?: "left" | "right" | "center";
    /** Columns with the same group share a heading above them (e.g. RECEIPT). */
    group?: string;
    /** Receipt columns are shaded light green, issue columns light red. */
    tone?: ExportTone;
    /** Excel stores these as numbers. */
    numeric?: boolean;
};

/**
 * data = an ordinary line; section / subsection = a heading across the whole
 * width (label only); subtotal / total / grand = totals, shaded and bold.
 */
export type ExportRowKind = "data" | "section" | "subsection" | "subtotal" | "total" | "grand";

export type ExportRow = {
    kind: ExportRowKind;
    label?: string;
    cells?: Record<string, string>;
};

/** Small totals table printed above the report (optional). */
export type ExportSummary = {
    columns: string[];
    rows: { label: string; tone?: ExportTone; cells: string[] }[];
};

export type ExportDoc = {
    title: string;
    filters?: string;
    columns: ExportColumn[];
    rows: ExportRow[];
    summary?: ExportSummary;
    /** dd-mm-yyyy hh:mm AM/PM */
    printedAt: string;
    userName: string;
};

export type ExportOptions = {
    showFilters: boolean;
    showSummary: boolean;
    printDateTime: boolean;
    printUser: boolean;
    pageNumbers: boolean;
    landscape: boolean;
    borders: boolean;
    colors: boolean;
    boldHeadings: boolean;
    repeatHeader: boolean;
    fontSize: "small" | "normal" | "large";
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
    showFilters: true,
    showSummary: true,
    printDateTime: true,
    printUser: true,
    pageNumbers: true,
    landscape: false,
    borders: true,
    colors: true,
    boldHeadings: true,
    repeatHeader: true,
    fontSize: "normal",
};

/** Colours shared by the three outputs (hex, no #). */
export const EXPORT_COLORS = {
    title: "B0122B",
    head: "EAD7EF",
    headPlain: "E6E6E6",
    group: "1D33B8",
    section: "19702C",
    receipt: "E6F4EA",
    issue: "FCE8E6",
    subtotal: "F7F2F9",
    total: "EFE3F3",
    grand: "E2CFEA",
    subtotalPlain: "F2F2F2",
    totalPlain: "E6E6E6",
    grandPlain: "D9D9D9",
};

const pad = (n: number) => String(n).padStart(2, "0");

/** dd-mm-yyyy hh:mm AM/PM */
export const formatPrintedAt = (d: Date) => {
    const hours = d.getHours() % 12 || 12;
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? "AM" : "PM"}`;
};

export const exportFileName = (title: string) =>
    title.split("\n")[0].replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "report";

export const isTotalRow = (kind: ExportRowKind) => kind === "subtotal" || kind === "total" || kind === "grand";

const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A CSS string literal (for @page margin boxes). */
const cssString = (text: string) => `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ")}"`;

const FONT_PX = { small: 9, normal: 11, large: 13 } as const;

/** The full print page. The footer of every page holds print date/time, "x of y" and the user (Chromium browsers). */
export function exportToHtml(doc: ExportDoc, o: ExportOptions) {
    const c = EXPORT_COLORS;
    const font = FONT_PX[o.fontSize];
    const border = o.borders ? "1px solid #777" : "none";
    const footerFont = "font: bold 10px Arial, sans-serif;";
    const footer = [
        o.printDateTime ? `@bottom-left { content: ${cssString(doc.printedAt)}; ${footerFont} }` : "",
        o.pageNumbers ? `@bottom-center { content: counter(page) " of " counter(pages); ${footerFont} }` : "",
        o.printUser && doc.userName ? `@bottom-right { content: ${cssString(`User : ${doc.userName}`)}; ${footerFont} }` : "",
    ].join("\n");
    const css = `
        @page { size: A4 ${o.landscape ? "landscape" : "portrait"}; margin: 12mm 10mm 16mm; ${footer} }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; font-size: ${font}px; color: #000;
            -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { text-align: center; font-size: ${font + 5}px; margin: 0 0 2px; white-space: pre-line; ${o.colors ? `color: #${c.title};` : ""} }
        .filters { text-align: center; font-size: ${font - 1}px; margin: 0 0 8px; color: #333; }
        table { width: 100%; border-collapse: collapse; }
        thead { display: ${o.repeatHeader ? "table-header-group" : "table-row-group"}; }
        tr { break-inside: avoid; }
        th, td { border: ${border}; padding: 3px 6px; vertical-align: top; }
        th { font-weight: ${o.boldHeadings ? "bold" : "normal"}; text-align: left; background: #${o.colors ? c.head : c.headPlain}; }
        ${o.borders ? "" : "thead tr:last-child th { border-bottom: 1px solid #000; } tr.total td, tr.grand td { border-top: 1px solid #000; }"}
        th.grp { text-align: center; ${o.colors ? `color: #${c.group};` : ""} }
        .r { text-align: right; white-space: nowrap; } .c { text-align: center; }
        ${o.colors ? `.receipt { background: #${c.receipt}; } .issue { background: #${c.issue}; }` : ""}
        tr.section td { font-weight: bold; font-size: ${font + 1}px; padding-top: 6px; ${o.colors ? `color: #${c.section};` : ""} }
        tr.subsection td { font-weight: bold; padding-left: 18px; ${o.colors ? `color: #${c.group};` : ""} }
        tr.subtotal td { font-weight: bold; background: #${o.colors ? c.subtotal : c.subtotalPlain}; }
        tr.total td { font-weight: bold; background: #${o.colors ? c.total : c.totalPlain}; }
        tr.grand td { font-weight: bold; background: #${o.colors ? c.grand : c.grandPlain}; border-top: 2px solid #000; }
        .summary { width: auto; margin: 0 auto 10px; }
        .summary th, .summary td { border: 1px solid #777; }
    `;
    const cols = doc.columns;
    const hasGroups = cols.some((col) => col.group);
    const alignClass = (col: ExportColumn) => (col.align === "right" ? "r" : col.align === "center" ? "c" : "");
    const cls = (...names: (string | undefined | false)[]) => {
        const list = names.filter(Boolean).join(" ");
        return list ? ` class="${list}"` : "";
    };

    let top = "", sub = "";
    cols.forEach((col, i) => {
        if (!col.group) {
            top += `<th${hasGroups ? ' rowspan="2"' : ""}${cls(alignClass(col), col.tone)}>${escapeHtml(col.label)}</th>`;
            return;
        }
        if (cols[i - 1]?.group !== col.group) {
            let span = 0;
            while (cols[i + span]?.group === col.group) span++;
            top += `<th colspan="${span}"${cls("grp", col.tone)}>${escapeHtml(col.group)}</th>`;
        }
        sub += `<th${cls(alignClass(col), col.tone)}>${escapeHtml(col.label)}</th>`;
    });
    const head = `<thead><tr>${top}</tr>${hasGroups ? `<tr>${sub}</tr>` : ""}</thead>`;

    const body = doc.rows.map((row) => {
        if (row.kind === "section" || row.kind === "subsection") {
            return `<tr class="${row.kind}"><td colspan="${cols.length}">${escapeHtml(row.label ?? "")}</td></tr>`;
        }
        const tds = cols.map((col) =>
            `<td${cls(alignClass(col), col.tone)}>${escapeHtml(row.cells?.[col.key] ?? "")}</td>`).join("");
        return `<tr${row.kind === "data" ? "" : ` class="${row.kind}"`}>${tds}</tr>`;
    }).join("");

    const summary = o.showSummary && doc.summary?.rows.length
        ? `<table class="summary"><thead><tr><th></th>${doc.summary.columns.map((h) => `<th class="r">${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${
            doc.summary.rows.map((r) => `<tr${cls(r.tone)}><td><b>${escapeHtml(r.label)}</b></td>${r.cells.map((v) => `<td class="r">${escapeHtml(v)}</td>`).join("")}</tr>`).join("")
        }</tbody></table>`
        : "";

    const heading = doc.title.trim();
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(heading.split("\n")[0] || "Report")}</title>
        <style>${css}</style></head><body>
        ${heading ? `<h1>${escapeHtml(heading)}</h1>` : ""}
        ${o.showFilters && doc.filters ? `<p class="filters">${escapeHtml(doc.filters)}</p>` : ""}
        ${summary}
        <table>${head}<tbody>${body}</tbody></table>
        </body></html>`;
}

/** Opens the browser's print window with the report. */
export function printExport(doc: ExportDoc, o: ExportOptions) {
    const win = window.open("", "_blank");
    if (!win) throw new Error("The print window was blocked. Allow pop-ups for this site.");
    win.document.write(exportToHtml(doc, o));
    win.document.close();
    win.focus();
    win.print();
    win.close();
}
