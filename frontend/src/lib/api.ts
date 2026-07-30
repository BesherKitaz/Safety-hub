// frontend/src/lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json"
  },
});

// Attach the current session token to every API request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

// Clear invalid sessions and move users away from forbidden screens.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    } else if (error.response?.status === 403) {
      if (window.location.pathname !== "/user") {
        window.location.replace("/user");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
