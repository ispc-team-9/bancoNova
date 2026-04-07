export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface PasswordRecoveryRequest {
  identifier: string;
}

export interface PasswordResetRequest {
  identifier: string;
  otp_code: string;
  new_password: string;
  confirm_password: string;
}
