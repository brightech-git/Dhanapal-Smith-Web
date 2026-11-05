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
