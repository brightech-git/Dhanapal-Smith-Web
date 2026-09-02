// src/service/introducerService.ts
import { getAxiosInstance } from "@/api/axiosInstance";
import { Introducer } from "@/types/giftVoucher";

export const IntroducerService = {
    getAll: async (): Promise<Introducer[]> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.get("/introducers");
        console.log(response ,"introducers")
        return response.data;
    },

    getActive: async (): Promise<Introducer[]> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.get("/introducers/active");
        return response.data;
    },

    getById: async (introducerId: number): Promise<Introducer> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.get(`/introducers/${introducerId}`);
        return response.data;
    },

    create: async (introducer: Partial<Introducer>): Promise<Introducer> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.post("/introducers", introducer);
        return response.data;
    },

    update: async (introducerId: number, introducer: Partial<Introducer>): Promise<Introducer> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.put(`/introducers/${introducerId}`, introducer);
        return response.data;
    },

    delete: async (introducerId: number): Promise<boolean> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.delete(`/introducers/${introducerId}`);
        return response.status === 204 || response.status === 200;
    },
};
