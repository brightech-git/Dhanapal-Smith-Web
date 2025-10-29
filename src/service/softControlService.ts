import axiosInstance from "@/api/axiosInstance";

export interface SoftControl {
    id: number;
    ctlid: string;
    description: string;
    updatedDate: Date|string;
}

export const fetchSoftControls = async (): Promise<SoftControl[]> => {
    const response = await axiosInstance.get('/softcontrol');
    return response.data;
}