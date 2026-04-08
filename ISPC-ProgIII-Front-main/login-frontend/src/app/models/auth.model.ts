export interface LoginRequest {
  dni: string;
  password: string;
  captcha_token: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  dni: string;
  password: string;
  captcha_token: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  dni: string | null;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: {
    id: number;
    username: string;
    email: string;
    dni: string | null;
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
