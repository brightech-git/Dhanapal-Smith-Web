// hooks/smith/useSmithOperations.ts
import { useState } from 'react';
import { smithTransactionService, smithDetailsService } from '@/service/smithService'
import { SmithFullData } from '@/types/smith';

export const useSmithOperations = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteSmith = async (smithId: number): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Delete both transaction and details
            await smithTransactionService.delete(smithId);
            await smithDetailsService.delete(smithId);

            setLoading(false);
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to delete smith';
            setError(errorMessage);
            setLoading(false);
            return false;
        }
    };

    const editSmith = async (smithId: number, updatedData: Partial<SmithFullData>): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Update transaction data
            const transactionData = {
                smithId: smithId,
                smithName: updatedData.SMITHNAME || '',
                grwt: updatedData.GRWT || 0,
                netwt: updatedData.NETWT || 0,
                pcs: updatedData.PCS || 0,
                upi: updatedData.UPI || 0,
                card: updatedData.CARD || 0,
                cash: updatedData.CASH || 0,
                check: updatedData.CHECK || 0,
                rtgs: updatedData.RTGS || 0,
            };

            await smithTransactionService.update(smithId, transactionData);

            // Update details data
            const detailsData = {
                smithId: smithId,
                streetAddress: updatedData.STREET_ADDRESS || '',
                locality: updatedData.LOCALITY || '',
                mobileNumber: updatedData.MOBILE_NUMBER || '',
                city: updatedData.CITY || '',
                state: updatedData.STATE || '',
                country: updatedData.COUNTRY || '',
                pincode: updatedData.PINCODE || '',
            };

            await smithDetailsService.update(detailsData);

            setLoading(false);
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update smith';
            setError(errorMessage);
            setLoading(false);
            return false;
        }
    };

    const clearError = () => setError(null);

    return {
        deleteSmith,
        editSmith,
        loading,
        error,
        clearError,
    };
};