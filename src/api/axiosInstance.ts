// src/api/publicUrl.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// ✅ Use NEXT_PUBLIC_ prefix so it's available in Next.js client-side
const BASE_URL = process.env.REACT_APP_BASE_URL || "https://smith.dhanapaljewellery.com/api/v1";

const baseUrl ="http://localhost:8097/api/v1"
console.log("BASE_URL:", BASE_URL)
// const baseURL = 'https://app.bmgjewellers.com/api/v1';

console.log("BASE_URL:", BASE_URL); // Debugging line

if (!BASE_URL) {
    console.warn("⚠️ NEXT_PUBLIC_BASE_URL is not defined in .env file");
}

const axiosInstance: AxiosInstance = axios.create({
    baseURL: baseUrl
}); 


export default axiosInstance;
