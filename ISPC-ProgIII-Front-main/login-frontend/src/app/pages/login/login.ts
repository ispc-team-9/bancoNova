import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../service/auth.service';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, parameters: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoginSuccess?: (token: string) => void;
    onRecaptchaLoginExpired?: () => void;
    onRecaptchaLoginError?: () => void;
  }
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  apiError = '';
  isLoginBlocked = false;
  lockRemainingText = '';
  isPasswordVisible = false;
  recaptchaSiteKey = environment.recaptchaSiteKey;

  @ViewChild('recaptchaContainer') recaptchaContainer?: ElementRef<HTMLDivElement>;

  private readonly maxLoginAttempts = 3;
  private readonly lockMinutes = 5;
  private readonly lockoutMessage = 'Se alcanzaron 3 intentos. Espere 5 minutos para volver a intentarlo.';
  private readonly rememberedDniKey = 'rememberedDni';
  private readonly attemptsPrefix = 'login_attempts_';
  private lockTimerId: ReturnType<typeof setInterval> | null = null;
  private recaptchaWidgetId: number | null = null;

  loginForm: FormGroup = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false],
    captchaToken: ['', [Validators.required]]
  });

  ngOnInit(): void {
    window.onRecaptchaLoginSuccess = (token: string) => {
      this.loginForm.patchValue({ captchaToken: token });
      this.loginForm.get('captchaToken')?.markAsDirty();
      this.loginForm.get('captchaToken')?.updateValueAndValidity();
    };

    window.onRecaptchaLoginExpired = () => {
      this.loginForm.patchValue({ captchaToken: '' });
      this.loginForm.get('captchaToken')?.markAsTouched();
      this.loginForm.get('captchaToken')?.updateValueAndValidity();
    };

    window.onRecaptchaLoginError = () => {
      this.loginForm.patchValue({ captchaToken: '' });
      this.apiError = 'No fue posible inicializar reCAPTCHA. Recarga la pagina e intenta nuevamente.';
    };

    const savedDni = localStorage.getItem(this.rememberedDniKey);
    if (savedDni) {
      this.loginForm.patchValue({ dni: savedDni, rememberMe: true });
      this.refreshLockState(savedDni);
    }

    this.loginForm.get('dni')?.valueChanges.subscribe((value: string) => {
      const trimmedDni = (value ?? '').trim();
      this.refreshLockState(trimmedDni);
    });
  }

  ngAfterViewInit(): void {
    this.renderRecaptcha();
  }

  ngOnDestroy(): void {
    if (this.lockTimerId) {
      clearInterval(this.lockTimerId);
      this.lockTimerId = null;
    }

    delete window.onRecaptchaLoginSuccess;
    delete window.onRecaptchaLoginExpired;
    delete window.onRecaptchaLoginError;
  }

  hasFieldError(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      if (controlName === 'dni') {
        return 'El DNI es obligatorio.';
      }

      if (controlName === 'password') {
        return 'La contrasena es obligatoria.';
      }

      if (controlName === 'captchaToken') {
        return 'Debes completar el reCAPTCHA para continuar.';
      }
    }

    if (control.errors['pattern']) {
      return 'Ingresa un DNI valido (solo numeros).';
    }

    if (control.errors['minlength']) {
      return 'La contrasena debe tener al menos 8 caracteres.';
    }

    return 'Campo invalido.';
  }

  async onForgotPassword(): Promise<void> {
    const { value: identifier } = await Swal.fire({
      title: 'Recuperar cuenta',
      input: 'text',
      inputLabel: 'Usuario o correo',
      inputPlaceholder: 'invocador o invocador@correo.com',
      showCancelButton: true,
      confirmButtonText: 'Solicitar OTP',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563EB',
      background: '#FFFFFF',
      color: '#1E293B',
      showLoaderOnConfirm: true,
      preConfirm: async (value) => {
        const trimmedValue = (value ?? '').trim();
        if (!trimmedValue) {
          Swal.showValidationMessage('Ingresa un usuario o correo valido.');
          return null;
        }

        try {
          await firstValueFrom(
            this.authService.requestOtp({
              identifier: trimmedValue
            })
          );
          return trimmedValue;
        } catch (error: any) {
          const message = error?.error?.error || 'No fue posible solicitar el OTP en este momento.';
          Swal.showValidationMessage(message);
          return null;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      showClass: {
        popup: 'tft-swal-show'
      },
      hideClass: {
        popup: 'tft-swal-hide'
      }
    });

    if (!identifier) {
      return;
    }

    await Swal.fire({
      icon: 'info',
      title: 'OTP generado',
      text: 'Revisa la consola del backend para ver el OTP de prueba.',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#2563EB',
      background: '#FFFFFF',
      color: '#1E293B',
      showClass: {
        popup: 'tft-swal-show'
      },
      hideClass: {
        popup: 'tft-swal-hide'
      }
    });

    await Swal.fire({
      title: 'Confirmar OTP y nueva contrasena',
      html: `
        <input id="otpCode" class="swal2-input" placeholder="OTP de 6 digitos" maxlength="6">
        <input id="newPassword" type="password" class="swal2-input" placeholder="Nueva contrasena">
        <input id="confirmPassword" type="password" class="swal2-input" placeholder="Confirmar contrasena">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563EB',
      background: '#FFFFFF',
      color: '#1E293B',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const otpCode = (document.getElementById('otpCode') as HTMLInputElement)?.value?.trim();
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;

        if (!otpCode || otpCode.length !== 6) {
          Swal.showValidationMessage('El OTP debe tener 6 digitos.');
          return;
        }

        if (!newPassword || newPassword.length < 8) {
          Swal.showValidationMessage('La nueva contrasena debe tener al menos 8 caracteres.');
          return;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Las contrasenas no coinciden.');
          return;
        }

        try {
          await firstValueFrom(
            this.authService.resetPassword({
              identifier,
              otp_code: otpCode,
              new_password: newPassword,
              confirm_password: confirmPassword
            })
          );
        } catch (error: any) {
          const message = error?.error?.error || 'No fue posible restablecer la contrasena.';
          Swal.showValidationMessage(message);
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      showClass: {
        popup: 'tft-swal-show'
      },
      hideClass: {
        popup: 'tft-swal-hide'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        await Swal.fire({
          icon: 'success',
          title: 'Contrasena actualizada',
          text: 'Ya puedes iniciar sesion con tu nueva contrasena.',
          confirmButtonText: 'Perfecto',
          confirmButtonColor: '#2563EB',
          background: '#FFFFFF',
          color: '#1E293B',
          showClass: {
            popup: 'tft-swal-show'
          },
          hideClass: {
            popup: 'tft-swal-hide'
          }
        });
      }
    });
  }

  onSubmit() {
    if (this.isLoading) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.recaptchaSiteKey) {
      this.apiError = 'reCAPTCHA no configurado. Define una Site Key en environment.ts.';
      return;
    }

    const { dni, password, rememberMe, captchaToken } = this.loginForm.value;
    if (!captchaToken) {
      this.loginForm.get('captchaToken')?.markAsTouched();
      return;
    }

    const trimmedDni = (dni ?? '').trim();
    const currentState = this.getLockState(trimmedDni);
    if (currentState.lockedUntil && currentState.lockedUntil > Date.now()) {
      this.applyBlockedState(currentState.lockedUntil);
      this.apiError = this.lockoutMessage;
      return;
    }

    this.isLoading = true;
    this.apiError = '';

    if (rememberMe) {
      localStorage.setItem(this.rememberedDniKey, trimmedDni);
    } else {
      localStorage.removeItem(this.rememberedDniKey);
    }

    this.authService.login({ dni: trimmedDni, password, captcha_token: captchaToken })
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (response) => {
          console.log('Login successful', response);
          this.clearLockState(trimmedDni);
          localStorage.setItem('accessToken', response.access);
          localStorage.setItem('refreshToken', response.refresh);

          Swal.fire({
            title: 'Ingreso exitoso',
            text: 'Acceso validado correctamente.',
            icon: 'success',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#FFFFFF',
            color: '#1E293B',
            showClass: {
              popup: 'tft-swal-show'
            },
            hideClass: {
              popup: 'tft-swal-hide'
            }
          }).then(() => {
            this.router.navigate(['/dashboard']);
          });
        },
        error: (error) => {
          console.error('Login failed', error);
          this.resetRecaptcha();
          const statusCode = error?.status;
          const backendMessage = error?.error?.detail || error?.error?.error;

          if (statusCode === 429) {
            const lockedUntil = Date.now() + (this.lockMinutes * 60 * 1000);
            this.saveLockState(trimmedDni, { attempts: 0, lockedUntil });
            this.applyBlockedState(lockedUntil);
            this.apiError = backendMessage || this.lockoutMessage;
          } else if (statusCode === 401) {
            const nextState = this.increaseFailedAttempt(trimmedDni);
            if (nextState.lockedUntil) {
              this.applyBlockedState(nextState.lockedUntil);
              this.apiError = this.lockoutMessage;
            } else {
              this.apiError = 'No fue posible validar las credenciales ingresadas.';
            }
          } else if (statusCode === 0) {
            this.apiError = 'No hay conexion con el servidor.';
          } else {
            this.apiError = backendMessage || 'No fue posible iniciar sesion en este momento.';
          }

          Swal.fire({
            title: 'No se pudo iniciar sesion',
            text: this.apiError,
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#2563EB',
            background: '#FFFFFF',
            color: '#1E293B',
            showClass: {
              popup: 'tft-swal-show'
            },
            hideClass: {
              popup: 'tft-swal-hide'
            }
          });

          // Extra safety in case an upstream interceptor short-circuits finalize.
          this.isLoading = false;
        }
      });
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  private renderRecaptcha(): void {
    if (!this.recaptchaSiteKey || !this.recaptchaContainer?.nativeElement) {
      return;
    }

    const grecaptcha = window.grecaptcha;
    if (!grecaptcha?.render) {
      setTimeout(() => this.renderRecaptcha(), 300);
      return;
    }

    if (this.recaptchaWidgetId !== null) {
      return;
    }

    this.recaptchaWidgetId = grecaptcha.render(this.recaptchaContainer.nativeElement, {
      sitekey: this.recaptchaSiteKey,
      callback: 'onRecaptchaLoginSuccess',
      'expired-callback': 'onRecaptchaLoginExpired',
      'error-callback': 'onRecaptchaLoginError',
    });
  }

  private resetRecaptcha(): void {
    if (this.recaptchaWidgetId !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(this.recaptchaWidgetId);
    }
    this.loginForm.patchValue({ captchaToken: '' });
    this.loginForm.get('captchaToken')?.markAsTouched();
  }

  private getStorageKey(dni: string): string {
    return `${this.attemptsPrefix}${dni}`;
  }

  private getLockState(dni: string): { attempts: number; lockedUntil: number | null } {
    if (!dni) {
      return { attempts: 0, lockedUntil: null };
    }

    const raw = localStorage.getItem(this.getStorageKey(dni));
    if (!raw) {
      return { attempts: 0, lockedUntil: null };
    }

    try {
      const parsed = JSON.parse(raw) as { attempts?: number; lockedUntil?: number | null };
      return {
        attempts: parsed.attempts ?? 0,
        lockedUntil: parsed.lockedUntil ?? null,
      };
    } catch {
      return { attempts: 0, lockedUntil: null };
    }
  }

  private saveLockState(dni: string, state: { attempts: number; lockedUntil: number | null }): void {
    if (!dni) {
      return;
    }

    localStorage.setItem(this.getStorageKey(dni), JSON.stringify(state));
  }

  private clearLockState(dni: string): void {
    if (!dni) {
      return;
    }

    localStorage.removeItem(this.getStorageKey(dni));
    this.isLoginBlocked = false;
    this.lockRemainingText = '';
    if (this.lockTimerId) {
      clearInterval(this.lockTimerId);
      this.lockTimerId = null;
    }
  }

  private increaseFailedAttempt(dni: string): { attempts: number; lockedUntil: number | null } {
    const state = this.getLockState(dni);
    const nextAttempts = state.attempts + 1;

    if (nextAttempts >= this.maxLoginAttempts) {
      const lockedUntil = Date.now() + (this.lockMinutes * 60 * 1000);
      const blockedState = { attempts: 0, lockedUntil };
      this.saveLockState(dni, blockedState);
      return blockedState;
    }

    const nextState = { attempts: nextAttempts, lockedUntil: null };
    this.saveLockState(dni, nextState);
    return nextState;
  }

  private applyBlockedState(lockedUntil: number): void {
    this.isLoginBlocked = true;
    this.updateLockRemaining(lockedUntil);

    if (this.lockTimerId) {
      clearInterval(this.lockTimerId);
    }

    this.lockTimerId = setInterval(() => {
      const now = Date.now();
      if (now >= lockedUntil) {
        this.isLoginBlocked = false;
        this.lockRemainingText = '';
        if (this.lockTimerId) {
          clearInterval(this.lockTimerId);
          this.lockTimerId = null;
        }
        return;
      }

      this.updateLockRemaining(lockedUntil);
    }, 1000);
  }

  private refreshLockState(dni: string): void {
    const state = this.getLockState(dni);
    if (!state.lockedUntil) {
      this.isLoginBlocked = false;
      this.lockRemainingText = '';
      if (this.lockTimerId) {
        clearInterval(this.lockTimerId);
        this.lockTimerId = null;
      }
      return;
    }

    if (Date.now() >= state.lockedUntil) {
      this.clearLockState(dni);
      return;
    }

    this.applyBlockedState(state.lockedUntil);
  }

  private updateLockRemaining(lockedUntil: number): void {
    const remainingMs = Math.max(lockedUntil - Date.now(), 0);
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.lockRemainingText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
