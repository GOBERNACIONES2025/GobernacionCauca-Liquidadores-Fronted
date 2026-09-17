import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
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
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    usuario: ['liquidador_rentas', [Validators.required]],
    clave: ['admin123', [Validators.required]]
  });

  isLoading = signal(false);
  showPassword = signal(false);

  fillDemo(nombre: string, user: string, rol: string): void {
    this.loginForm.patchValue({
      usuario: user,
      clave: 'admin123'
    });
    this.toast.info(`Datos cargados para: ${nombre}`);
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const { usuario } = this.loginForm.value;

    setTimeout(() => {
      this.isLoading.set(false);
      let nombreCompleto = 'Liquidador Oficial de Rentas';
      let roles = ['LIQUIDADOR', 'FUNCIONARIO'];

      if (usuario.includes('supervisor')) {
        nombreCompleto = 'Supervisor Fiscal de Registro';
        roles = ['SUPERVISOR_RENTAS', 'FUNCIONARIO'];
      } else if (usuario.includes('admin')) {
        nombreCompleto = 'Administrador de Rentas Departamentales';
        roles = ['ADMIN', 'SUPERVISOR_RENTAS'];
      }

      const mockUser = {
        id: 99,
        nombre: nombreCompleto,
        email: `${usuario}@cauca.gov.co`,
        roles: roles
      };

      this.authState.setSession(mockUser, 'REGISTROS');
      this.toast.success(`¡Bienvenido, ${nombreCompleto}!`);
      this.router.navigate(['/registros/gobernacion/dashboard']);
    }, 400);
  }
}
