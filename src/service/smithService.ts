import axiosInstance from '@/api/axiosInstance';
import { SmithFormData, SmithTransaction, SmithDetails } from '@/types/smith';

// Remove the duplicate interfaces since we're importing them from types
// Keep only the service functions

// Smith Transaction API calls
export const smithTransactionService = {
    // Get all transactions
    getAll: async (): Promise<SmithTransaction[]> => {
        const response = await axiosInstance.get('/smithtransaction');
        return response.data;
    },

    // Get transaction by ID
    getById: async (id: number): Promise<SmithTransaction> => {
        const response = await axiosInstance.get(`/smithtransaction/${id}`);
        return response.data;
    },

    // Create new transaction
    create: async (transaction: Omit<SmithTransaction, 'smithId'>): Promise<{ message: string; data?: any }> => {
        const response = await axiosInstance.post('/smithtransaction', transaction);
        return response.data;
    },

    // Update transaction
    update: async (id: number, transaction: SmithTransaction): Promise<{ message: string }> => {
        const response = await axiosInstance.put(`/smithtransaction/${id}`, transaction);
        return response.data;
    },

    // Delete transaction
    delete: async (id: number): Promise<{ message: string }> => {
        const response = await axiosInstance.delete(`/smithtransaction/${id}`);
        return response.data;
    },
};

// Smith Details API calls
export const smithDetailsService = {
    // Get all details
    getAll: async (): Promise<SmithDetails[]> => {
        const response = await axiosInstance.get('/smithdetails');
        return response.data;
    },

    // Get details by ID
    getById: async (id: number): Promise<SmithDetails> => {
        const response = await axiosInstance.get(`/smithdetails/${id}`);
        return response.data;
    },

    // Create new details
    create: async (details: Omit<SmithDetails, 'detailId'>): Promise<{ message: string; data?: any }> => {
        const response = await axiosInstance.post('/smithdetails', details);
        return response.data;
    },

    // Update details
    update: async (details: SmithDetails): Promise<{ message: string }> => {
        const response = await axiosInstance.put('/smithdetails', details);
        return response.data;
    },

    // Delete details
    delete: async (id: number): Promise<{ message: string }> => {
        const response = await axiosInstance.delete(`/smithdetails/${id}`);
        return response.data;
    },
};

// Helper function to convert form data to transaction data
export const convertFormDataToTransaction = (formData: SmithFormData): Omit<SmithTransaction, 'smithId'> => {
    return {
        smithName: formData.SMITHNAME,
        grwt: formData.GRWT,
        netwt: formData.NETWT,
        pcs: formData.PCS,
        upi: formData.UPI,
        card: formData.CARD,
        cash: formData.CASH,
        check: formData.CHECK,
        rtgs: formData.RTGS,
    };
};

// Helper function to convert form data to details data
export const convertFormDataToDetails = (formData: SmithFormData, smithId: number): Omit<SmithDetails, 'detailId'> => {
    return {
        smithId: smithId,
        streetAddress: formData.STREET_ADDRESS,
        locality: formData.LOCALITY,
        mobileNumber: formData.MOBILE_NUMBER,
        city: formData.CITY,
        state: formData.STATE,
        country: formData.COUNTRY,
        pincode: formData.PINCODE,
    };
};

// Combined service for creating both transaction and details
export const smithService = {
    createCompleteSmith: async (formData: SmithFormData): Promise<{
        success: boolean;
        message: string;
        smithId?: number;
        detailId?: number;
    }> => {
        try {
            // First create the Smith Transaction
            const transactionData = convertFormDataToTransaction(formData);

            console.log('Creating Smith Transaction:', transactionData);
            const transactionResponse = await smithTransactionService.create(transactionData);
            console.log('Transaction Response:', transactionResponse);

            // Extract smithId from response - adjust this based on your API response structure
            // If your backend returns the created object with ID, it would be in transactionResponse.data
            const smithId = transactionResponse.data?.smithId || transactionResponse.data?.id;

            if (!smithId) {
                throw new Error('Smith ID not returned from transaction creation. Please check your API response structure.');
            }

            // Then create the Smith Details with the obtained smithId
            const detailsData = convertFormDataToDetails(formData, smithId);

            console.log('Creating Smith Details:', detailsData);
            const detailsResponse = await smithDetailsService.create(detailsData);
            console.log('Details Response:', detailsResponse);

            return {
                success: true,
                message: 'Smith and details created successfully',
                smithId: smithId,
                detailId: detailsResponse.data?.detailId || detailsResponse.data?.id
            };

        } catch (error: any) {
            console.error('Error creating complete smith:', error);

            // Provide more specific error messages
            let errorMessage = 'Failed to create smith';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            throw new Error(errorMessage);
        }
    },
};