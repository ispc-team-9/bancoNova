import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = false;
  apiError = '';

  registerForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

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
      return 'La contrasena es obligatoria.';
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

    const { username, email, password } = this.registerForm.getRawValue();

    this.isLoading = true;
    this.apiError = '';

    this.authService
      .register({ username: username!, email: email!, password: password! })
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Registro exitoso',
            text: 'Tu cuenta fue creada correctamente.',
            icon: 'success',
            timer: 1600,
            timerProgressBar: true,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/']);
          });
        },
        error: (error) => {
          this.apiError =
            error?.error?.username?.[0] ||
            error?.error?.email?.[0] ||
            error?.error?.password?.[0] ||
            error?.error?.detail ||
            'No se pudo registrar el usuario.';
        }
      });
  }
}
