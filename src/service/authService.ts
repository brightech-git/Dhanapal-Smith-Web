// src/services/authService.ts
import axiosInstance from "@/api/axiosInstance";

export interface AuthRequest {
    userName: string;
    password: string;
}

export interface UserResponse {
    userName: string;
    message: string;
}

const authService = {
    login: async ({ userName, password }: AuthRequest): Promise<UserResponse> => {
        try {
            const { data } = await axiosInstance.post<UserResponse>('/users/login', {
                userName,
                password,
            });
            return data;
        } catch (error: any) {
            // Throw a clean error message
            const message = error.response?.data?.message || error.message || 'Login failed';
            throw new Error(message);
        }
    },
};

export default authService;
