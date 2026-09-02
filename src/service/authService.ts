import axios from "axios";

export interface AuthRequest {
    userName: string;
    password: string;
    projectName : string
}

const authService = {
    login: async ({ userName, password ,projectName}: AuthRequest) => {
        try {
            // ✅ Get MAIN_URL from config.json loaded at runtime
            const MAIN_URL = window?.appConfig?.MAIN_URL;
            if (!MAIN_URL) throw new Error("MAIN_URL not loaded from config.json");

            // ✅ Append /user/login dynamically
            const loginUrl = `${MAIN_URL.replace(/\/$/, "")}/users/login`;

            console.log({userName , password ,projectName},"payload request")

            const { data } = await axios.post(loginUrl, { userName, password, projectName });

            console.log(data ,"loginresponse");
           
            return data;
        } catch (error: any) {
            const message =
                error.response?.data?.message || error.message || "Login failed";
            throw new Error(message);
        }
    },
};

export default authService;
