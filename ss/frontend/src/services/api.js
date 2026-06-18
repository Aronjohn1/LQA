import axios from "axios";

const defaultApiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://lqa.onrender.com" : "http://localhost:1000");
export const API_BASE_URL = defaultApiBase;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default api;

