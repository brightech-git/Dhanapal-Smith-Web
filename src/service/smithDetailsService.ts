// src/services/smithDetailsService.ts
import {getAxiosInstance} from "@/api/axiosInstance";
import { SmithDetails } from "@/types/smithDetails";


export const SmithDetailsService = {
    getAll: async (): Promise<SmithDetails[]> => {
    
        const axiosInstance =getAxiosInstance();
       // console.log(axiosInstance,'base at smithDetail')
        const response = await axiosInstance.get("/smithdetails");
        return response.data;
    },

    getById: async (id: number): Promise<SmithDetails> => {
        const axiosInstance =getAxiosInstance();
        const response = await axiosInstance.get(`/smithdetails/${id}`);
        return response.data.data ?? response.data; // handle ApiResponse structure
    },

    create: async (details: Partial<SmithDetails>): Promise<SmithDetails> => {
        const axiosInstance =getAxiosInstance();
        const response = await axiosInstance.post("/smithdetails", details);
        return response.data.data ?? response.data; // handle ApiResponse structure
    },

    update: async (details: SmithDetails): Promise<SmithDetails> => {
        const axiosInstance =getAxiosInstance();
        const response = await axiosInstance.put("/smithdetails", details);
        return response.data.data ?? response.data;
    },

    delete: async (id: number): Promise<boolean> => {
        const axiosInstance =getAxiosInstance();
        const response = await axiosInstance.delete(`/smithdetails/${id}`);
        return response.status === 200;
    },
};
