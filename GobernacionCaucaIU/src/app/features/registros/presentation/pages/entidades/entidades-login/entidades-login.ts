import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegistrosAuthService } from '../../../../core/auth/registros-auth.service';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-entidades-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './entidades-login.html',
  styleUrl: './entidades-login.css'
})
export class EntidadesLoginComponent {
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
      portalRequerido: 'ENTIDAD_REGISTRO'
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const entidadNombre = response.usuario.entidadRegistro?.nombre || response.usuario.nombre;
        this.toast.success(`Bienvenido al Portal Notarial, ${entidadNombre}!`);
        this.router.navigate(['/registros/entidades/solicitudes']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorDetail = err?.error?.detail || err?.error?.title || 'Credenciales invalidas o sin acceso al portal de entidades';
        this.toast.error(errorDetail);
      }
    });
  }
}