
import Decimal from "decimal.js";

export const WEIGHT_DECIMALS = 3;
export const TOUCH_DECIMALS = 2;

/** Weight transaction types: R = Receipt, P = Purchase, PR = Purchase Return. */
export type WeightTranType = "R" | "I" | "PR";
export const isWeightTranType = (type: unknown): type is WeightTranType => type === "R" || type === "I" || type === "PR";
export const WEIGHT_TRAN_TYPES: { value: WeightTranType; label: string }[] = [
    { value: "R", label: "RECEIPT" },
    { value: "I", label: "ISSUE" },
    { value: "PR", label: "PURCHASE RETURN" },
];
export const weightTranTypeLabel = (type: string | null | undefined) =>
    WEIGHT_TRAN_TYPES.find((t) => t.value === type)?.label ?? "";

const toDecimal = (value: unknown) => {
    const text = String(value ?? "").trim();
    if (!text) return new Decimal(0);
    try {
        return new Decimal(text);
    } catch {
        return new Decimal(0);
    }
};

export const roundTo = (value: unknown, places: number) =>
    toDecimal(value).toDecimalPlaces(places, Decimal.ROUND_HALF_UP).toNumber();

export const roundWeight = (value: unknown) => roundTo(value, WEIGHT_DECIMALS);
export const roundTouch = (value: unknown) => roundTo(value, TOUCH_DECIMALS);

/** Pure weight = gross weight x touch / 100, to 3 decimals. */
export const pureWeight = (grossWeight: unknown, touch: unknown) =>
    toDecimal(grossWeight).times(toDecimal(touch)).dividedBy(100)
        .toDecimalPlaces(WEIGHT_DECIMALS, Decimal.ROUND_HALF_UP).toNumber();

/** Exact sum of weights, to 3 decimals. */
export const sumWeights = (values: unknown[]) =>
    values.reduce<Decimal>((total, value) => total.plus(toDecimal(value)), new Decimal(0))
        .toDecimalPlaces(WEIGHT_DECIMALS, Decimal.ROUND_HALF_UP).toNumber();

/** Fixed-decimal text for display, e.g. 12.5 -> "12.500". */
export const formatFixed = (value: unknown, places: number) =>
    toDecimal(value).toFixed(places, Decimal.ROUND_HALF_UP);

/**
 * The ledger columns a weight row fills from its type and pure weight:
 * Receipt and Purchase go to receipts. Purchase Return goes to payments (issue).
 */
export const ledgerFromPureWeight = (type: string | null | undefined, purewt: number) =>
    type === "R" ? { receipts: purewt, payments: 0 } : { receipts: 0, payments: purewt };
