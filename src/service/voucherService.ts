// src/service/voucherService.ts
import { getAxiosInstance } from "@/api/axiosInstance";
import {
    GenerateVoucherRequest,
    ReturnVoucherRequest,
    VoucherGeneration,
    VoucherPrefix,
    VoucherReportRequest,
    VoucherReportResponse,
    VoucherDetails
} from "@/types/giftVoucher";

export const VoucherPrefixService = {
    getActive: async (): Promise<VoucherPrefix[]> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.get("/voucher-prefixes/active");
        return response.data;
    },
    getByVoucherNumber: async (id: number ,type:string): Promise<VoucherDetails> =>{
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.get(`/vouchers/search/${id}`,{params: {"issRec" :type}});
        return response.data;
    }
};

export const VoucherService = {
    generate: async (request: GenerateVoucherRequest): Promise<VoucherGeneration[]> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.post("/vouchers/generate", request);
        return response.data;
    },

    returnVoucher: async (request: ReturnVoucherRequest): Promise<string> => {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.post("/vouchers/return", request);
        return response.data;
    },

    getTallyReport: async (
        request: VoucherReportRequest
    ): Promise<VoucherReportResponse[]> => {
        const axiosInstance = getAxiosInstance();
        const params: Record<string, string | number> = {};

        if (request.issRec) params.issRec = request.issRec;
        if (request.introducerId) params.introducerId = request.introducerId;
        if (request.batchNo) params.batchNo = request.batchNo;
        if (request.voucherNo) params.voucherNo = request.voucherNo;
        if (request.mobileNo) params.mobileNo = request.mobileNo;
        if (request.fromDate) params.fromDate = request.fromDate;
        if (request.toDate) params.toDate = request.toDate;

        const response = await axiosInstance.get("/vouchers/report", { params });
        return response.data;
    },
};
