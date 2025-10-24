// src/service/smithTransactionService.ts
import axiosInstance from "@/api/axiosInstance";

export interface SmithTransaction {
    id: number;
    smithId: string;
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number;
}

export interface NewSmithTransaction {
    smithId: string | number; 
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number;
}

export interface SmithFlow {
    id: number;
    receipts: number;
    payments: number;
    date: string;
    balance?: number;
    weightDifference?: number | null;
}

export interface SmithTransactionDetail extends SmithTransaction {
    cashFlows: SmithFlow[];
    weightFlows: SmithFlow[];
}


export interface CashFlow {
    id: number;
    receipts: number;
    payments: number;
    date: string;
    balance: number;
}

export interface WeightFlow {
    id: number;
    receipts: number;
    payments: number;
    date: string;
    weightDifference: number | null;
}

export const addTransaction = async (payload: NewSmithTransaction) => {
    console.log("smith Payload:", payload);
    const response = await axiosInstance.post("/smith/transactions", payload);
    return response.data as NewSmithTransaction;
};
// Fetch all smith transactions
export const fetchSmithTransactions = async (): Promise<SmithTransaction[]> => {
    const response = await axiosInstance.get("/smith/transactions");
    return response.data.map((item: any) => ({
        id: item.id,
        smithId: item.smithId,
        name: item.name,
        date: item.date,
        cashBalance: item.cashBalance,
        weightBalance: item.weightBalance,
    }));
};

// Fetch one smith transaction with flows
export const fetchSmithTransactionDetail = async (id: number): Promise<SmithTransactionDetail> => {
    const response = await axiosInstance.get(`/smithTransactions/${id}`);
    return response.data;
};

// Cash Flow APIs
export const addCashFlow = async (smithId: string, payload: Partial<SmithFlow>) => {
    const response = await axiosInstance.post(`smith/cash?smithId=${smithId}`, payload);
    return response.data;
};

export const updateCashFlow = async (id: number, payload: Partial<SmithFlow>) => {
    const response = await axiosInstance.put(`smith/cash/${id}`, payload);
    return response.data;
};

export const deleteCashFlow = async (id: number) => {
    const response = await axiosInstance.delete(`smith/cash/${id}`);
    return response.data;
};

// Weight Flow APIs
export const addWeightFlow = async (smithId: string, payload: Partial<SmithFlow>) => {
    const response = await axiosInstance.post(`smith/weight?smithId=${smithId}`, payload);
    return response.data;
};

export const updateWeightFlow = async (id: number, payload: Partial<SmithFlow>) => {
    const response = await axiosInstance.put(`smith/weight/${id}`, payload);
    return response.data;
};

export const deleteWeightFlow = async (id: number) => {
    const response = await axiosInstance.delete(`smith/weight/${id}`);
    return response.data;
};

export const fetchCashFlows = async (smithId: string): Promise<CashFlow[]> => {
    console.log("Fetching cash flows for smithId:", smithId);
    const response = await axiosInstance.get(`/smith/cash?smithId=${smithId}`);
    return response.data;
};

export const fetchWeightFlows = async (smithId: string): Promise<WeightFlow[]> => {
    console.log("Fetching cash flows for smithId:", smithId);
    const response = await axiosInstance.get(`/smith/weight?smithId=${smithId}`);
    return response.data;
};
export const patchCashFlow = async (id: number, payload: Partial<CashFlow>) => {
    console.log(payload,id, 'smithcashpayload')
    const response = await axiosInstance.patch(`smith/cash/${id}`, payload);
    return response.data;
};

// Weight Flow partial update
export const patchWeightFlow = async (id: number, payload: Partial<WeightFlow>) => {
    console.log(payload,id,'smithweightpayload')
    const response = await axiosInstance.patch(`smith/weight/${id}`, payload);
    return response.data;
};