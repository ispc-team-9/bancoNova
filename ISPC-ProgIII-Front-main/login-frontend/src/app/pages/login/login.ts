import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  apiError = '';

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rememberMe: [false]
  });

  ngOnInit(): void {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.loginForm.patchValue({ username: savedUsername, rememberMe: true });
    }
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
      return controlName === 'username' ? 'El usuario es obligatorio.' : 'La contrasena es obligatoria.';
    }

    if (control.errors['minlength']) {
      return controlName === 'username'
        ? 'El usuario debe tener al menos 3 caracteres.'
        : 'La contrasena debe tener al menos 8 caracteres.';
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
      confirmButtonColor: '#4e6cff',
      background: '#09172c',
      color: '#e8edf6',
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
          const message = error?.error?.error || 'No se pudo solicitar el OTP. Intentalo de nuevo.';
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
      confirmButtonColor: '#4e6cff',
      background: '#09172c',
      color: '#e8edf6',
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
      confirmButtonColor: '#4e6cff',
      background: '#09172c',
      color: '#e8edf6',
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
          const message = error?.error?.error || 'No se pudo restablecer la contrasena.';
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
          confirmButtonColor: '#4e6cff',
          background: '#09172c',
          color: '#e8edf6',
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

    this.isLoading = true;
    this.apiError = '';

    const { username, password, rememberMe } = this.loginForm.value;

    if (rememberMe) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }

    this.authService.login({ username, password })
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (response) => {
          console.log('Login successful', response);
          localStorage.setItem('accessToken', response.access);
          localStorage.setItem('refreshToken', response.refresh);

          Swal.fire({
            title: 'Ingreso exitoso',
            text: 'Bienvenido a Space Gods.',
            icon: 'success',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
            background: '#09172c',
            color: '#e8edf6',
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
          const statusCode = error?.status;
          const backendMessage = error?.error?.detail || error?.error?.error;

          if (statusCode === 401) {
            this.apiError = 'Usuario o contrasena incorrectos.';
          } else if (statusCode === 0) {
            this.apiError = 'No se pudo conectar con el servidor.';
          } else {
            this.apiError = backendMessage || 'No se pudo iniciar sesion. Intentalo de nuevo.';
          }

          Swal.fire({
            title: 'No se pudo iniciar sesion',
            text: this.apiError,
            icon: 'error',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#4e6cff',
            background: '#09172c',
            color: '#e8edf6',
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
}
