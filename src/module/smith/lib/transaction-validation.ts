export function validateTransactionValues(issue: unknown, receipt: unknown): void {
    const parse = (value: unknown) => value == null || value === "" ? 0 : Number(value);
    const issueValue = parse(issue);
    const receiptValue = parse(receipt);
    if (!Number.isFinite(issueValue) || !Number.isFinite(receiptValue)) {
        throw new Error("Issue and Receipt must be valid numbers");
    }
    if (issueValue === 0 && receiptValue === 0) {
        throw new Error("Issue or Receipt must have a non-zero value (positive or negative)");
    }
}
