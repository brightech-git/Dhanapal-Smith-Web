// src/api/smithTransactionService.ts
import axiosInstance from "@/api/axiosInstance";
import { SmithTransaction } from "@/types/smithcreate";

const BASE_PATH = "/smithtransaction";

export const SmithTransactionService = {
    getAll: async (): Promise<SmithTransaction[]> => {
        const { data } = await axiosInstance.get<{ message: string; data: SmithTransaction[] }>(BASE_PATH);
        return data.data;
    },

    getById: async (id: number): Promise<SmithTransaction | null> => {
        try {
            const { data } = await axiosInstance.get<{ message: string; data: SmithTransaction }>(`${BASE_PATH}/${id}`);
            return data.data;
        } catch (err: any) {
            if (err.response?.status === 404) return null;
            throw err;
        }
    },

    create: async (transaction: SmithTransaction): Promise<SmithTransaction> => {
        console.log("transaction:", transaction);
        const { data } = await axiosInstance.post<{ message: string; data: SmithTransaction }>(BASE_PATH, transaction);
        return data.data;
    },

    update: async (id: number, transaction: SmithTransaction): Promise<SmithTransaction | null> => {
        try {
            const { data } = await axiosInstance.put<{ message: string; data: SmithTransaction }>(`${BASE_PATH}/${id}`, transaction);
            return data.data;
        } catch (err: any) {
            if (err.response?.status === 404) return null;
            throw err;
        }
    },

    delete: async (id: number): Promise<boolean> => {
        try {
            await axiosInstance.delete(`${BASE_PATH}/${id}`);
            return true;
        } catch (err: any) {
            if (err.response?.status === 404) return false;
            throw err;
        }
    },
};
