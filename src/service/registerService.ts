import { CreateUser } from "@/types/CreateUser";
import { getAxiosInstance } from "@/api/axiosInstance";

export const CreateUserService = async (user: CreateUser) => {
    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.post(`/users/register-subuser`, {
        parentUserId: user.parentUserId,
        userName: user.username,
        password: user.password,
    });

    return response.data;
};

export const getAllUsers = async () => {
    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.get(`/users/all`);

    return response.data;
};

export const getUserById = async (id: number) => {
    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.get(`/users/${id}`);

    return response.data;
};

export const updateUser = async (sno: number , username:string , password:string ,active : number|string) => {

    console.log("updateUser", sno, username, password, active);

    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.put(`/users/${sno}`, {
        userName: username,
        password: password,
        active: active
    });

    return response.data;
};

export const deleteUser = async (id: number) => {
    const axiosInstance = getAxiosInstance();

    const response = await axiosInstance.delete(`/users/${id}`);

    return response.data;
};