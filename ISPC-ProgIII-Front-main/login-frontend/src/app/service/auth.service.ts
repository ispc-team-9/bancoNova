import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  PasswordRecoveryRequest,
  PasswordResetRequest,
  RegisterRequest,
  RegisterResponse
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiBaseUrl}/register/`, payload);
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiBaseUrl}/login/`, payload);
  }

  requestOtp(payload: PasswordRecoveryRequest): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/password-recovery/request-otp/`, payload);
  }

  resetPassword(payload: PasswordResetRequest): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/password-recovery/reset/`, payload);
  }
}
