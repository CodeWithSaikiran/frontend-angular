export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  token?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  message: string;
}