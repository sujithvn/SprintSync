import axios from 'axios';
import { User, Task, ApiResponse, AuthLoginResponse, AiSuggestRequest, AiSuggestResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Token management
let authToken: string | null = localStorage.getItem('authToken');

// Request interceptor to add token to headers
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor to handle token updates
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored token on unauthorized responses
      authToken = null;
      localStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Helper function to store token
const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

// Helper function to clear token
const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('authToken');
};

// Auth endpoints
export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/auth/login', { username, password });
    const loginData: ApiResponse<AuthLoginResponse> = response.data;
    
    if (loginData.success && loginData.data?.token) {
      // Store the token
      setAuthToken(loginData.data.token);
      // Return just the user data in the expected ApiResponse format
      return {
        success: true,
        data: loginData.data.user
      };
    }
    
    return {
      success: false,
      message: loginData.message || 'Login failed'
    };
  },

  register: async (username: string, password: string, skills?: string): Promise<ApiResponse<User>> => {
    const response = await api.post('/api/auth/register', { username, password, skills });
    const registerData: ApiResponse<AuthLoginResponse> = response.data;
    
    if (registerData.success && registerData.data?.token) {
      // Store the token
      setAuthToken(registerData.data.token);
      // Return just the user data in the expected ApiResponse format
      return {
        success: true,
        data: registerData.data.user
      };
    }
    
    return {
      success: false,
      message: registerData.message || 'Registration failed'
    };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      const response = await api.post('/api/auth/logout');
      clearAuthToken();
      return response.data;
    } catch (error) {
      // Clear token even if logout request fails
      clearAuthToken();
      return { success: true, data: null };
    }
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/verify');
    return response.data;
  },
};

// Task endpoints
export const taskApi = {
  getTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get('/api/tasks');
    return response.data;
  },

  getTask: async (id: number): Promise<ApiResponse<Task>> => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },

  createTask: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Task>> => {
    const response = await api.post('/api/tasks', task);
    return response.data;
  },

  updateTask: async (id: number, task: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.put(`/api/tasks/${id}`, task);
    return response.data;
  },

  deleteTask: async (id: number): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },
};

// AI endpoints
export const aiApi = {
  suggestTaskDescription: async (request: AiSuggestRequest): Promise<ApiResponse<AiSuggestResponse>> => {
    const response = await api.post('/api/ai/suggest', request);
    return response.data;
  },
};

// Stats endpoints
export const statsApi = {
  getTopUsers: async () => {
    const response = await api.get('/api/stats/top-users');
    return response.data;
  },
  
  getPlatformStats: async () => {
    const response = await api.get('/api/stats/platform');
    return response.data;
  },
};

export default api;
