import { getAxiosInstance } from "@/lib/api/client";
import { useAuth } from "@/src/features/auth/lib/auth-context";

export interface SoftControl {
    id: number;
    ctlid: string;
    description: string;
    updatedDate: Date|string;
}

export const fetchSoftControls = async (): Promise<SoftControl[]> => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get('/softcontrol');
    return response.data;
}