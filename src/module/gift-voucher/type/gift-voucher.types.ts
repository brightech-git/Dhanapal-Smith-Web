/** Backend /introducers record. */
export interface Introducer {
    id: number;
    introducerName: string;
    initial: string | null;
    active: string; // "Y" | "N"
    doorno: string | null;
    street: string | null;
    area: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    dob: string | null; // YYYY-MM-DD
    email: string | null;
    gstno: string | null;
    mobile: string | null;
    pan: string | null;
    createdatetime?: string;
    updatedatetime?: string;
}

/** Editable introducer fields (the form keeps blanks as ""). */
export type IntroducerInput = Omit<Introducer, "id" | "createdatetime" | "updatedatetime">;

/** I = issue, R = receipt. */
export type IssRec = "I" | "R";

/** Backend /gift-transactions record. */
export interface GiftTran {
    id: number;
    tranId: number;
    introducerId: number;
    introducerName: string;
    tagno: string;
    amount: number;
    piece: number;
    issRec: IssRec;
    createdAt: string;
}

/** POST/PUT /gift-transactions body. Issues get their tag from the server, so tagno is for receipts only. */
export interface GiftTranInput {
    introducerId: number;
    amount: number;
    piece: number;
    issRec: IssRec;
    tagno?: string | null;
}

/** GET /gift-transactions/remaining row: an issue with something still to receive. */
export interface GiftRemaining {
    issueId: number;
    tranId: number;
    introducerId: number;
    introducerName: string;
    tagno: string;
    issuedAmount: number;
    receivedAmount: number;
    remainingAmount: number;
    issuedPiece: number;
    receivedPiece: number;
    remainingPiece: number;
    createdAt: string;
}

/** Query filters (all optional). type A = all. */
export interface GiftFilter {
    type?: "A" | IssRec;
    introducerId?: number;
    tranId?: number;
    tagno?: string;
    search?: string;
}
