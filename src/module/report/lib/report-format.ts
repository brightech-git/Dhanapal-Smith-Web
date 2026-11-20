// Formatting shared by the reports.

/** dd-mm-yyyy from YYYY-MM-DD, "" when empty. */
export const formatReportDate = (value?: string | null) => {
    const m = (value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

/** Fixed decimals with no thousands separators (203120.00); "" for null. */
export const formatReportNumber = (value: number | string | null | undefined, decimals: number) => {
    if (value == null || value === "") return "";
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(decimals) : "";
};

/** Today as YYYY-MM-DD (local time). */
export const todayIso = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
