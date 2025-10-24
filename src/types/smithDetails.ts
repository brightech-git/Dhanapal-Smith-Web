// src/types/smithDetails.ts
export interface SmithDetails {
    sno?: number;
    smithId?: number; // Primary key
    title?: string;
    initial?: string;
    pname?: string;
    mname?: string;
    sname?: string;
    doorno?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    area?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    mobile?: string;
    email?: string;
    systemid?: string;
    costid?: string;
    pan?: string;
    gstno?: string;
    stateid?: number;
    active: "Y" | "N";
    createdAt?: string;
    updatedAt?: string;
    editData?: Partial<SmithDetails> | null;
    onSubmit?: (formValues: Partial<SmithDetails>) => void;
    onCancel?: () => void;
}
