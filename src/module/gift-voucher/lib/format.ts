/** Amount with Indian grouping and two decimals. */
export const formatAmount = (v: number | null | undefined) =>
    new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v ?? 0));

/** The server stores CreatedAt in UTC without a zone; show it as local DD-MM-YYYY HH:mm. */
export const formatDateTime = (v?: string | null) => {
    if (!v) return "—";
    const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? v : `${v}Z`);
    if (isNaN(d.getTime())) return v;
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Pieces are whole numbers; amount allows up to 4 decimals (decimal(19,4)). */
export const parsePiece = (v: string) => (v.trim() === "" ? 0 : Number(v));
export const parseAmount = (v: string) => (v.trim() === "" ? 0 : Number(v));
