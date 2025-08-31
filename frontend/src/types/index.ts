export interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  skills?: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  totalMinutes: number;
  userId?: number;
  username?: string; // Only available for admin users
  createdAt: string;
  updatedAt: string;
}

export interface AiSuggestRequest {
  title: string;
  context?: string; // Optional additional context
}

export interface AiSuggestResponse {
  suggestedDescription: string;
  estimatedMinutes: number;
  suggestedTags?: string[];
  confidence: number; // 0-1 scale
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
