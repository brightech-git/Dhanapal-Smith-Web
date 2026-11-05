import { api } from "@/lib/api/envelope";
import type { SmithDetails } from "@/src/module/smith/type/smith-details.types";

/** Backend Smith (/smiths). */
interface SmithApi {
    id: number;
    smithName: string;
    initial?: string | null;
    active: string;
    doorno?: string | null;
    street?: string | null;
    area?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    dob?: string | null;
    email?: string | null;
    gstno?: string | null;
    mobile?: string | null;
    pan?: string | null;
    createdatetime?: string;
    updatedatetime?: string;
}

const blank = (v?: string | null) => (v == null || String(v).trim() === "" ? null : String(v).trim());

const fromApi = (s: SmithApi): SmithDetails => ({
    smithId: s.id,
    pname: s.smithName,
    initial: s.initial ?? "",
    active: (s.active === "N" ? "N" : "Y") as "Y" | "N",
    doorno: s.doorno ?? "",
    address1: s.street ?? "",
    area: s.area ?? "",
    city: s.city ?? "",
    state: s.state ?? "",
    pincode: s.pincode ?? "",
    dob: s.dob ?? "",
    email: s.email ?? "",
    gstno: s.gstno ?? "",
    mobile: s.mobile ?? "",
    pan: s.pan ?? "",
    createdAt: s.createdatetime,
    updatedAt: s.updatedatetime,
});

// Only the editable fields: the server rejects unknown properties.
const toApi = (d: Partial<SmithDetails>) => ({
    smithName: (d.pname ?? "").trim(),
    initial: blank(d.initial),
    active: d.active === "N" ? "N" : "Y",
    doorno: blank(d.doorno),
    street: blank(d.address1),
    area: blank(d.area),
    city: blank(d.city),
    state: blank(d.state),
    pincode: blank(d.pincode),
    dob: blank(d.dob),
    email: blank(d.email),
    gstno: blank(d.gstno)?.toUpperCase() ?? null,
    mobile: blank(d.mobile),
    pan: blank(d.pan)?.toUpperCase() ?? null,
});

export const SmithDetailsService = {
    getAll: async (): Promise<SmithDetails[]> => ((await api.get<SmithApi[]>("smiths")) ?? []).map(fromApi),
    getById: async (id: number): Promise<SmithDetails> => fromApi(await api.get<SmithApi>(`smiths/${id}`)),
    create: async (details: Partial<SmithDetails>): Promise<SmithDetails> => fromApi(await api.post<SmithApi>("smiths", toApi(details))),
    update: async (details: SmithDetails): Promise<SmithDetails> => fromApi(await api.put<SmithApi>(`smiths/${details.smithId}`, toApi(details))),
    delete: async (id: number): Promise<boolean> => {
        await api.delete(`smiths/${id}`);
        return true;
    },
};
