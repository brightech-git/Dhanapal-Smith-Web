// src/services/smithDetailsService.ts
import axiosInstance from "@/api/axiosInstance";
import { SmithDetails } from "@/types/smithDetails";

export const SmithDetailsService = {
    getAll: async (): Promise<SmithDetails[]> => {
        const response = await axiosInstance.get("/smithdetails");
        return response.data;
    },

    getById: async (id: number): Promise<SmithDetails> => {
        const response = await axiosInstance.get(`/smithdetails/${id}`);
        return response.data.data ?? response.data; // handle ApiResponse structure
    },

    create: async (details: Partial<SmithDetails>): Promise<SmithDetails> => {
        const response = await axiosInstance.post("/smithdetails", details);
        return response.data.data ?? response.data; // handle ApiResponse structure
    },

    update: async (details: SmithDetails): Promise<SmithDetails> => {
        const response = await axiosInstance.put("/smithdetails", details);
        return response.data.data ?? response.data;
    },

    delete: async (id: number): Promise<boolean> => {
        const response = await axiosInstance.delete(`/smithdetails/${id}`);
        return response.status === 200;
    },
};
