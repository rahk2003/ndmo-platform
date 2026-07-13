import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
export const AUTH_TOKEN_KEY = "ndmo-auth-token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000,
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && window.localStorage.getItem(AUTH_TOKEN_KEY)) {
      window.dispatchEvent(new CustomEvent("ndmo-auth-expired"));
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = "The backend service could not process the request.") {
  return error?.response?.data?.detail || error?.message || fallback;
}
