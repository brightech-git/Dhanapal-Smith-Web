// src/utils/numberToWords.ts
const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
    if (n < 20) return ONES[n];
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return `${TENS[tens]}${rest ? " " + ONES[rest] : ""}`;
}

function threeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let out = "";
    if (hundred) out += `${ONES[hundred]} Hundred`;
    if (rest) out += `${out ? " " : ""}${twoDigits(rest)}`;
    return out;
}

/** Converts a non-negative integer to words using the Indian numbering system (Lakh/Crore). */
export function numberToWordsIndian(value: number): string {
    const num = Math.floor(Math.abs(value));
    if (num === 0) return "Zero";

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;

    const parts: string[] = [];
    if (crore) parts.push(`${threeDigits(crore)} Crore`);
    if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
    if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
    if (rest) parts.push(threeDigits(rest));

    return parts.join(" ");
}

/** Formats a rupee amount as words, e.g. 5000 -> "Five Thousand Rupees Only". */
export function amountToRupeeWords(amount: number): string {
    return `${numberToWordsIndian(amount)} Rupees Only`;
}
