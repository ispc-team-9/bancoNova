import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {
  private readonly authService = inject(AuthService);

  private readonly modalTheme = {
    confirmButtonColor: '#2563EB',
    background: '#FFFFFF',
    color: '#1E293B',
    showClass: { popup: 'tft-swal-show' },
    hideClass: { popup: 'tft-swal-hide' }
  } as const;

  async startRecoveryFlow(): Promise<void> {
    const identifier = await this.requestIdentifier();
    if (!identifier) {
      return;
    }

    await this.showOtpGeneratedInfo();

    const wasReset = await this.confirmOtpAndPassword(identifier);
    if (!wasReset) {
      return;
    }

    await this.showSuccessMessage();
  }

  private async requestIdentifier(): Promise<string | null> {
    const { value } = await Swal.fire({
      title: 'Recuperar cuenta',
      input: 'text',
      inputLabel: 'Usuario o correo',
      inputPlaceholder: 'invocador o invocador@correo.com',
      showCancelButton: true,
      confirmButtonText: 'Solicitar OTP',
      cancelButtonText: 'Cancelar',
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async (rawValue) => {
        const identifier = (rawValue ?? '').trim();
        if (!identifier) {
          Swal.showValidationMessage('Ingresa un usuario o correo valido.');
          return null;
        }

        try {
          await firstValueFrom(this.authService.requestOtp({ identifier }));
          return identifier;
        } catch (error: any) {
          const message = error?.error?.error || 'No fue posible solicitar el OTP en este momento.';
          Swal.showValidationMessage(message);
          return null;
        }
      },
      ...this.modalTheme
    });

    return value ?? null;
  }

  private async showOtpGeneratedInfo(): Promise<void> {
    await Swal.fire({
      icon: 'info',
      title: 'OTP generado',
      text: 'Revisa la consola del backend para ver el OTP de prueba.',
      confirmButtonText: 'Continuar',
      ...this.modalTheme
    });
  }

  private async confirmOtpAndPassword(identifier: string): Promise<boolean> {
    const result = await Swal.fire({
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
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const otpCode = (document.getElementById('otpCode') as HTMLInputElement)?.value?.trim();
        const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;

        if (!otpCode || otpCode.length !== 6) {
          Swal.showValidationMessage('El OTP debe tener 6 digitos.');
          return false;
        }

        if (!newPassword || newPassword.length < 8) {
          Swal.showValidationMessage('La nueva contrasena debe tener al menos 8 caracteres.');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Las contrasenas no coinciden.');
          return false;
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
          return true;
        } catch (error: any) {
          const message = error?.error?.error || 'No fue posible restablecer la contrasena.';
          Swal.showValidationMessage(message);
          return false;
        }
      },
      ...this.modalTheme
    });

    return !!result.isConfirmed;
  }

  private async showSuccessMessage(): Promise<void> {
    await Swal.fire({
      icon: 'success',
      title: 'Contrasena actualizada',
      text: 'Ya puedes iniciar sesion con tu nueva contrasena.',
      confirmButtonText: 'Perfecto',
      ...this.modalTheme
    });
  }
}
