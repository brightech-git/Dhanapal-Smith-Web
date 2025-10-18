import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { smithService, smithTransactionService, smithDetailsService } from '@/service/smithService'
import { SmithFormData, SmithTransaction, SmithDetails } from '@/types/smith'; // Now this import will work
import { useToast } from '@/context/smith/ToastContext';
// Hook for creating complete smith (transaction + details)
export const useCreateSmith = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: (formData: SmithFormData) => smithService.createCompleteSmith(formData),
        onSuccess: (data, variables) => {
            // Invalidate and refetch smith lists
            queryClient.invalidateQueries({ queryKey: ['smiths'] });
            queryClient.invalidateQueries({ queryKey: ['smithTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['smithDetails'] });

            // Show success toast
            addToast({
                type: 'success',
                title: 'Success!',
                message: 'Smith created successfully',
                action: {
                    label: 'View Smiths',
                    onClick: () => router.push('/smiths')
                }
            });

            // Redirect to smiths page
            router.push('/smiths');
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Creation Failed',
                message: error.message || 'Failed to create smith'
            });
        },
    });
};

// Hook for creating only Smith Transaction
export const useCreateSmithTransaction = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: (transaction: Omit<SmithTransaction, 'smithId'>) =>
            smithTransactionService.create(transaction),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['smithTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['smiths'] });

            addToast({
                type: 'success',
                title: 'Success!',
                message: 'Transaction created successfully'
            });

            // If you need the created smithId for immediate use
            return data;
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Failed',
                message: error.message || 'Failed to create transaction'
            });
        },
    });
};

// Hook for creating Smith Details
export const useCreateSmithDetails = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: (details: Omit<SmithDetails, 'detailId'>) =>
            smithDetailsService.create(details),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['smithDetails'] });
            queryClient.invalidateQueries({ queryKey: ['smiths'] });

            addToast({
                type: 'success',
                title: 'Success!',
                message: 'Smith details created successfully'
            });
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Failed',
                message: error.message || 'Failed to create smith details'
            });
        },
    });
};

// Hook for updating Smith Transaction
export const useUpdateSmithTransaction = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: ({ id, transaction }: { id: number; transaction: SmithTransaction }) =>
            smithTransactionService.update(id, transaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['smithTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['smiths'] });
            addToast({
                type: 'success',
                title: 'Success!',
                message: 'Transaction updated successfully'
            });
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: error.message || 'Failed to update transaction'
            });
        },
    });
};

// Hook for deleting Smith Transaction
export const useDeleteSmithTransaction = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    return useMutation({
        mutationFn: (id: number) => smithTransactionService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['smithTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['smiths'] });
            addToast({
                type: 'success',
                title: 'Success!',
                message: 'Transaction deleted successfully'
            });
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Delete Failed',
                message: error.message || 'Failed to delete transaction'
            });
        },
    });
};

// Hook for sequential creation (transaction first, then details)
export const useCreateSmithSequentially = () => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { addToast } = useToast();
    const createTransaction = useCreateSmithTransaction();
    const createDetails = useCreateSmithDetails();

    return useMutation({
        mutationFn: async (formData: SmithFormData) => {
            // First create transaction
            const transactionData = {
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

            const transactionResult = await createTransaction.mutateAsync(transactionData);

            // Extract smithId - you'll need to adjust this based on your API response
            const smithId = transactionResult.data?.smithId;

            if (!smithId) {
                throw new Error('Failed to get smith ID from transaction creation');
            }

            // Then create details
            const detailsData = {
                smithId: smithId,
                streetAddress: formData.STREET_ADDRESS,
                locality: formData.LOCALITY,
                mobileNumber: formData.MOBILE_NUMBER,
                city: formData.CITY,
                state: formData.STATE,
                country: formData.COUNTRY,
                pincode: formData.PINCODE,
            };

            await createDetails.mutateAsync(detailsData);

            return { smithId, message: 'Smith created successfully' };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['smiths'] });

            addToast({
                type: 'success',
                title: 'Success!',
                message: 'Smith created successfully',
                action: {
                    label: 'View Smiths',
                    onClick: () => router.push('/smiths')
                }
            });

            router.push('/smiths');
        },
        onError: (error: Error) => {
            addToast({
                type: 'error',
                title: 'Creation Failed',
                message: error.message || 'Failed to create smith'
            });
        },
    });
};