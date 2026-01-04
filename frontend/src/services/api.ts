import axios from "axios";
import type { User, Token, Extraction, ExtractionListResponse } from "../types";

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth endpoints
export const authApi = {
  register: async (email: string, password: string): Promise<User> => {
    const response = await api.post("/auth/register", { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<Token> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  refresh: async (): Promise<Token> => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Extraction endpoints
export const extractionApi = {
  create: async (
    file: File,
    columns?: string,
    multipleTables?: boolean,
    complexity?: "simple" | "regular" | "complex",
    priority?: "high" | "medium" | "low",
  ): Promise<Extraction> => {
    const formData = new FormData();
    formData.append("file", file);
    if (columns) formData.append("columns", columns);
    if (multipleTables !== undefined)
      formData.append("multiple_tables", String(multipleTables));
    if (complexity) formData.append("complexity", complexity);
    if (priority) formData.append("priority", priority);

    const response = await api.post("/extractions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  get: async (id: number): Promise<Extraction> => {
    const response = await api.get(`/extractions/${id}`);
    return response.data;
  },

  list: async (
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    search?: string,
  ): Promise<ExtractionListResponse> => {
    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };
    if (status && status !== "all") {
      params.status = status;
    }
    if (search) {
      params.search = search;
    }
    const response = await api.get("/extractions", { params });
    return response.data;
  },

  update: async (
    id: number,
    data: {
      input_filename?: string;
      columns_requested?: string[];
      multiple_tables?: boolean;
    },
  ): Promise<Extraction> => {
    const response = await api.patch(`/extractions/${id}`, data);
    return response.data;
  },

  download: async (id: number, outputFormat?: string): Promise<Blob> => {
    const params: Record<string, string> = {};
    if (outputFormat) {
      params.output_format = outputFormat;
    }
    const response = await api.get(`/extractions/${id}/download`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/extractions/${id}`);
  },
};
