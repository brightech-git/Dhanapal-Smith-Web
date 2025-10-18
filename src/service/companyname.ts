import axios from "axios";

export async function getCompanyName() {
    try {
        const response = await axios.get("/api/v1/company/get");
        return response.data; // Return only the useful data
    } catch (error) {
        console.error("Error fetching company name:", error);
        throw error; // Rethrow if you want the caller to handle it
    }
}
