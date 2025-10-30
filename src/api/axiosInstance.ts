// src/api/publicUrl.ts
import axios, { AxiosInstance } from "axios";

// ✅ Use NEXT_PUBLIC_ prefix so it's available in Next.js client-side
const BASE_URL = process.env.REACT_APP_BASE_URL || "https://www.eezab.com/api/v1";


const baseUrl ="http://localhost:8097/api/v1"
const devUrl ="https://eezab.com/api/v1"

// const baseURL = 'https://app.bmgjewellers.com/api/v1';


if (!BASE_URL) {
    console.warn("⚠️ NEXT_PUBLIC_BASE_URL is not defined in .env file");
}

const axiosInstance: AxiosInstance = axios.create({
    baseURL: BASE_URL
}); 


export default axiosInstance;
