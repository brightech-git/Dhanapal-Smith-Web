// Same rules as the backend's smith and introducer checks, so most mistakes show before saving.
const t = (s?: string | null) => (s ?? "").trim();

export const partyFieldError = (field: string, value?: string | null): string | undefined => {
    const v = t(value);
    if (!v) return undefined;
    switch (field) {
        case "mobile":
            return /^\+?[0-9]{7,15}$/.test(v) ? undefined : "7 to 15 digits";
        case "email":
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? undefined : "Invalid email";
        case "pincode":
            return /^[1-9][0-9]{5}$/.test(v) ? undefined : "6 digits, not starting with 0";
        case "pan":
            return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v.toUpperCase()) ? undefined : "Format ABCDE1234F";
        case "gstno":
            return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.toUpperCase()) ? undefined : "15-character GST number";
        default:
            return undefined;
    }
};

export const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
    "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Lakshadweep", "Puducherry",
];
