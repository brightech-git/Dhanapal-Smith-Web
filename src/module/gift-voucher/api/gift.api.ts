import { api } from "@/lib/api/envelope";
import type { GiftFilter, GiftIssueInput, GiftRemaining, GiftTran, GiftTranInput, Introducer, IntroducerInput } from "../type/gift-voucher.types";

export { getApiErrorMessage } from "@/lib/api/envelope";

const blank = (v: unknown) => (typeof v === "string" ? (v.trim() ? v.trim() : null) : v ?? null);
const params = (f: object) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// ---- Introducers: /introducers
// Only the editable fields: the server rejects unknown properties.
const introducerBody = (i: IntroducerInput) => ({
    introducerName: i.introducerName.trim(),
    initial: blank(i.initial),
    active: i.active === "N" ? "N" : "Y",
    doorno: blank(i.doorno),
    street: blank(i.street),
    area: blank(i.area),
    city: blank(i.city),
    state: blank(i.state),
    pincode: blank(i.pincode),
    dob: blank(i.dob),
    email: blank(i.email),
    gstno: (blank(i.gstno) as string | null)?.toUpperCase() ?? null,
    mobile: blank(i.mobile),
    pan: (blank(i.pan) as string | null)?.toUpperCase() ?? null,
});

export const fetchIntroducers = async (filter: { active?: "Y" | "N"; search?: string } = {}) =>
    (await api.get<Introducer[]>("introducers", params(filter))) ?? [];
export const createIntroducer = (input: IntroducerInput) => api.post<Introducer>("introducers", introducerBody(input));
export const updateIntroducer = (id: number, input: IntroducerInput) => api.put<Introducer>(`introducers/${id}`, introducerBody(input));
export const deleteIntroducer = (id: number) => api.delete(`introducers/${id}`);

// ---- Gift transactions: /gift-transactions
const num = (v: unknown) => Number(v ?? 0);
const toGift = (g: GiftTran): GiftTran => ({ ...g, amount: num(g.amount), piece: num(g.piece) });
const toRemaining = (r: GiftRemaining): GiftRemaining => ({
    ...r,
    issuedAmount: num(r.issuedAmount),
    receivedAmount: num(r.receivedAmount),
    remainingAmount: num(r.remainingAmount),
    issuedPiece: num(r.issuedPiece),
    receivedPiece: num(r.receivedPiece),
    remainingPiece: num(r.remainingPiece),
});

const giftBody = (g: GiftTranInput) => ({
    introducerId: g.introducerId,
    amount: num(g.amount),
    piece: Math.trunc(num(g.piece)),
    issRec: g.issRec,
    ...(g.tagno ? { tagno: g.tagno.trim() } : {}),
});

export const fetchGifts = async (filter: GiftFilter = {}) =>
    ((await api.get<GiftTran[]>("gift-transactions", params(filter))) ?? []).map(toGift);
export const fetchRemaining = async (filter: Omit<GiftFilter, "type"> = {}) =>
    ((await api.get<GiftRemaining[]>("gift-transactions/remaining", params(filter))) ?? []).map(toRemaining);
/** Issues `piece` gifts of `amount` each; returns one row (with its own tag) per piece, sharing a tranId. */
export const issueGifts = async (input: GiftIssueInput) =>
    ((await api.post<GiftTran[]>("gift-transactions/issue", {
        introducerId: input.introducerId,
        amount: num(input.amount),
        piece: Math.trunc(num(input.piece)),
    })) ?? []).map(toGift);

/** Receives (fully redeems) the given tags in one go; any bad tag fails the whole request. */
export const receiveGifts = async (tagnos: string[]) =>
    ((await api.post<GiftTran[]>("gift-transactions/receipt", tagnos.map((t) => t.trim()))) ?? []).map(toGift);
export const updateGift = async (id: number, input: GiftTranInput) => toGift(await api.put<GiftTran>(`gift-transactions/${id}`, giftBody(input)));
export const deleteGift = (id: number) => api.delete(`gift-transactions/${id}`);
