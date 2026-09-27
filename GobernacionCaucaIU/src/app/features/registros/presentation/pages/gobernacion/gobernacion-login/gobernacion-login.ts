import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegistrosAuthService } from '../../../../core/auth/registros-auth.service';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-gobernacion-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './gobernacion-login.html',
  styleUrl: './gobernacion-login.css'
})
export class GobernacionLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(RegistrosAuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    usuario: ['', [Validators.required]],
    clave: ['', [Validators.required]]
  });

  isLoading = signal(false);
  showPassword = signal(false);

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { usuario, clave } = this.loginForm.value;

    this.authService.login({
      emailOrUsuario: usuario,
      password: clave,
      portalRequerido: 'GOBERNACION'
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.toast.success(`¡Bienvenido, ${response.usuario.nombre}!`);
        this.router.navigate(['/registros/gobernacion/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorDetail = err?.error?.detail || err?.error?.title || 'Credenciales inválidas o sin acceso al portal';
        this.toast.error(errorDetail);
      }
    });
  }
}
