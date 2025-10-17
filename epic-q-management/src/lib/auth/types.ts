export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'coordinator';
  hospitalId: string | null;
  hospital?: {
    id: string;
    name: string;
  } | null;
  preferredLanguage: string;
  isActive: boolean;
  isTemporaryPassword: boolean;
  lastLogin: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}
