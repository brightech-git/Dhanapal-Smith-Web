/** Smith profile as the screens use it (mapped from the backend /smiths record). */
export interface SmithDetails {
    smithId?: number; // backend id
    pname?: string; // smithName
    initial?: string;
    doorno?: string;
    address1?: string; // street
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    dob?: string; // YYYY-MM-DD
    mobile?: string;
    email?: string;
    pan?: string;
    gstno?: string;
    active: "Y" | "N";
    createdAt?: string;
    updatedAt?: string;
}
