import { getAxiosInstance } from "@/api/axiosInstance";
import { useAuth } from "@/context/auth/AuthContext";

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