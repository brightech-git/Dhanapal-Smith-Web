// utils/dateHelpers.ts

// Convert stored/API date (yyyy-mm-dd) → dd-mm-yyyy for input
export const formatDateForInput = (apiDate: string): string => {
    if (!apiDate) return "";
    const [year, month, day] = apiDate.split("-");
    if (!year || !month || !day) return apiDate;
    return `${day}-${month}-${year}`;
};

// Convert user input (dd-mm-yyyy) → yyyy-mm-dd for API
export const parseDateFromInput = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const parts = trimmed.split("-");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts.map(p => p.padStart(2, "0"));
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return null;

    const date = new Date(`${year}-${month}-${day}`);
    if (isNaN(date.getTime())) return null;

    // Return in yyyy-mm-dd
    return `${year}-${month}-${day}`;
};