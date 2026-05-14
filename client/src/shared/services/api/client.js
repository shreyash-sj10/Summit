import axios from "axios";
import { STORAGE_TOKEN_KEY, STORAGE_USER_KEY } from "../../constants.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const method = String(err.config?.method || "").toLowerCase();
    const path = String(err.config?.url || "").replace(/\/$/, "");
    const isFailedLogin = status === 401 && method === "post" && path.endsWith("/auth/login");
    if (status === 401 && !isFailedLogin) {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      window.location.href = "/";
    }
    return Promise.reject(err);
  },
);

export default api;
