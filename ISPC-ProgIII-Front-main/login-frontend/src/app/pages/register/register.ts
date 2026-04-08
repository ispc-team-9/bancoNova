import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { AuthService } from '../../service/auth.service';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      render: (container: HTMLElement, parameters: Record<string, unknown>) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaRegisterSuccess?: (token: string) => void;
    onRecaptchaRegisterExpired?: () => void;
    onRecaptchaRegisterError?: () => void;
  }
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;
  apiError = '';
  recaptchaSiteKey = environment.recaptchaSiteKey;

  @ViewChild('recaptchaContainer') recaptchaContainer?: ElementRef<HTMLDivElement>;
  private recaptchaWidgetId: number | null = null;

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,10}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    captchaToken: ['', [Validators.required]],
  });

  ngOnInit(): void {
    window.onRecaptchaRegisterSuccess = (token: string) => {
      this.registerForm.patchValue({ captchaToken: token });
      this.registerForm.get('captchaToken')?.markAsDirty();
      this.registerForm.get('captchaToken')?.updateValueAndValidity();
    };

    window.onRecaptchaRegisterExpired = () => {
      this.registerForm.patchValue({ captchaToken: '' });
      this.registerForm.get('captchaToken')?.markAsTouched();
      this.registerForm.get('captchaToken')?.updateValueAndValidity();
    };

    window.onRecaptchaRegisterError = () => {
      this.registerForm.patchValue({ captchaToken: '' });
      this.apiError = 'No fue posible inicializar reCAPTCHA. Recarga la pagina e intenta nuevamente.';
    };
  }

  ngAfterViewInit(): void {
    this.renderRecaptcha();
  }

  ngOnDestroy(): void {
    delete window.onRecaptchaRegisterSuccess;
    delete window.onRecaptchaRegisterExpired;
    delete window.onRecaptchaRegisterError;
  }

  hasFieldError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      if (controlName === 'username') return 'El usuario es obligatorio.';
      if (controlName === 'email') return 'El email es obligatorio.';
      if (controlName === 'dni') return 'El DNI es obligatorio.';
      if (controlName === 'captchaToken') return 'Debes completar el reCAPTCHA para continuar.';
      return 'La contrasena es obligatoria.';
    }

    if (control.errors['pattern']) {
      return 'Ingresa un DNI valido (solo numeros).';
    }

    if (control.errors['email']) {
      return 'Ingresa un email valido.';
    }

    if (control.errors['minlength']) {
      return controlName === 'username'
        ? 'El usuario debe tener al menos 3 caracteres.'
        : 'La contrasena debe tener al menos 8 caracteres.';
    }

    return 'Campo invalido.';
  }

  onSubmit(): void {
    if (this.isLoading) {
      return;
    }

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.recaptchaSiteKey) {
      this.apiError = 'reCAPTCHA no configurado. Define una Site Key en environment.ts.';
      return;
    }

    const { username, email, dni, password, captchaToken } = this.registerForm.getRawValue();
    if (!captchaToken) {
      this.registerForm.get('captchaToken')?.markAsTouched();
      return;
    }

    this.isLoading = true;
    this.apiError = '';

    this.authService
      .register({ username: username!, email: email!, dni: dni!, password: password!, captcha_token: captchaToken! })
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Registro completado',
            text: 'La cuenta fue creada correctamente.',
            icon: 'success',
            timer: 1600,
            timerProgressBar: true,
            showConfirmButton: false,
            confirmButtonColor: '#2563EB',
            background: '#FFFFFF',
            color: '#1E293B',
          }).then(() => {
            this.router.navigate(['/']);
          });
        },
        error: (error) => {
          this.resetRecaptcha();
          this.apiError =
            error?.error?.username?.[0] ||
            error?.error?.email?.[0] ||
            error?.error?.dni?.[0] ||
            error?.error?.password?.[0] ||
            error?.error?.detail ||
            'No se pudo registrar el usuario.';
        }
      });
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
      callback: 'onRecaptchaRegisterSuccess',
      'expired-callback': 'onRecaptchaRegisterExpired',
      'error-callback': 'onRecaptchaRegisterError',
    });
  }

  private resetRecaptcha(): void {
    if (this.recaptchaWidgetId !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(this.recaptchaWidgetId);
    }
    this.registerForm.patchValue({ captchaToken: '' });
    this.registerForm.get('captchaToken')?.markAsTouched();
  }
}
