import axios from "axios";

export interface AuthRequest {
    userName: string;
    password: string;
}

const authService = {
    login: async ({ userName, password }: AuthRequest) => {
        try {
            // ✅ Get MAIN_URL from config.json loaded at runtime
            const MAIN_URL = window?.appConfig?.MAIN_URL;
            if (!MAIN_URL) throw new Error("MAIN_URL not loaded from config.json");

            // ✅ Append /user/login dynamically
            const loginUrl = `${MAIN_URL.replace(/\/$/, "")}/users/login`;

            const { data } = await axios.post(loginUrl, { userName, password });
           
            return data;
        } catch (error: any) {
            const message =
                error.response?.data?.message || error.message || "Login failed";
            throw new Error(message);
        }
    },
};

export default authService;
