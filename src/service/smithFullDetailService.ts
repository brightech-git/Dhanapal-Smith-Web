import axiosInstance from "@/api/axiosInstance";

// ✅ API endpoint for Smith full details
const SMITH_FULL_DETAILS_URL = "/fullDetails";

/**
 * Fetches all Smith full details.
 */
export const getSmithFullDetails = async (): Promise<any> => {
    try {
        
        const response = await axiosInstance.get(SMITH_FULL_DETAILS_URL);
        return response.data;
    } catch (error: any) {
        console.error("❌ Error fetching Smith full details:", error);
        throw error.response?.data || error.message;
    }
};
