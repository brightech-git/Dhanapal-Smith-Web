import { getAxiosInstance } from "@/lib/api/client";
import { useAuth } from "@/src/features/auth/lib/auth-context";

export interface SmithTransaction {
    id: number;
    smithId: string;
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number ;
}

export interface NewSmithTransaction {
    smithId: string | number; 
    name: string;
    date: string;
    cashBalance: number;
    weightBalance: number;
}

/** Attachment URLs on a cash/weight row (set via the /files upload). */
export interface FlowAttachmentFields {
    remarks?: string | null;
    imageFile?: string | null;
    pdfFile?: string | null;
    cameraImage?: string | null;
}

export interface SmithFlow extends FlowAttachmentFields {
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


export interface CashFlow extends FlowAttachmentFields {
    id: number;
    receipts: number;
    payments: number;
    date: string;
    balance: number;
}

export interface WeightFlow extends FlowAttachmentFields {
    id: number;
    receipts: number;
    payments: number;
    date: string;
    weightDifference: number | null;
}

export const addTransaction = async (payload: NewSmithTransaction) => {
    const axiosInstance = getAxiosInstance();
    //console.log(axiosInstance, 'base at smithFullDetail')
    const response = await axiosInstance.post("/smith/transactions", payload);
    return response.data as NewSmithTransaction;
};
// Fetch all smith transactions
export const fetchSmithTransactions = async (): Promise<SmithTransaction[]> => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get("/smith/transactions");
    const data = Array.isArray(response.data) ? response.data : [];

    return data.map((item: any) => ({
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
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get(`/smith/transactions/${id}`);
    return response.data;
};

// Cash Flow APIs
export const addCashFlow = async (smithId: string, payload: Partial<SmithFlow>) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.post(`smith/cash?smithId=${smithId}`, payload);
    return response.data;
};

export const updateCashFlow = async (id: number, payload: Partial<SmithFlow>) => {

    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.put(`smith/cash/${id}`, payload);
    return response.data;
};

export const deleteCashFlow = async (id: number) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.delete(`smith/cash/${id}`);
    return response.data;
};

// Weight Flow APIs
export const addWeightFlow = async (smithId: string, payload: Partial<SmithFlow>) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.post(`smith/weight?smithId=${smithId}`, payload);
    return response.data;
};

export const updateWeightFlow = async (id: number, payload: Partial<SmithFlow>) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.put(`smith/weight/${id}`, payload);
    return response.data;
};

export const deleteWeightFlow = async (id: number) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.delete(`smith/weight/${id}`);
    return response.data;
};

export const fetchCashFlows = async (smithId: string): Promise<CashFlow[]> => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get(`/smith/cash?smithId=${smithId}`);
    return response.data;
};

export const fetchWeightFlows = async (smithId: string): Promise<WeightFlow[]> => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get(`/smith/weight?smithId=${smithId}`);
    return response.data;
};
export const patchCashFlow = async (id: number, payload: Partial<CashFlow>) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.patch(`smith/cash/${id}`, payload);
    return response.data;
};

// Weight Flow partial update
export const patchWeightFlow = async (id: number, payload: Partial<WeightFlow>) => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.patch(`smith/weight/${id}`, payload);
    return response.data;
};

export const deleteSmithTransaction = async (id: number) => {
    try {

        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.delete(`/smith/transactions/${id}`);
        return response.data;
    } catch (error) {
        console.error("Delete transaction failed:", error);
        throw error;
    }
};
