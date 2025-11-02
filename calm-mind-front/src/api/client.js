import axios from "axios";

// Ensure this is the correct baseURL for your backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api", // was 5000
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the Authorization token for all requests, if present
api.interceptors.request.use((config) => {
  // Token from localStorage (preferred to allow requests from outside React context)
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handler: on 401, clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {}
      if (typeof window !== "undefined" && window.location?.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
