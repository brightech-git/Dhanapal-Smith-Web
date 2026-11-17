import { api } from "@/lib/api/envelope";

export interface SoftControl {
    id: number;
    CTLID: string | null;
    CTLNAME: string | null;
    CTLTEXT: string | null;
}

export const fetchSoftControls = async (): Promise<SoftControl[]> =>
    (await api.get<SoftControl[]>("soft-controls")) ?? [];

export const fetchSoftControlById = (id: number): Promise<SoftControl> =>
    api.get<SoftControl>(`soft-controls/${id}`);

/** CTLID and CTLNAME are required; the backend trims and uppercases CTLID. */
export type SoftControlInput = Omit<SoftControl, "id">;

export const createSoftControl = (values: SoftControlInput) => api.post<SoftControl>("soft-controls", values);

export const updateSoftControl = (id: number, values: SoftControlInput) => api.put<SoftControl>(`soft-controls/${id}`, values);

export const deleteSoftControl = (id: number) => api.delete(`soft-controls/${id}`);
