import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfiguracionFacade } from '../../../application/facades/configuracion.facade';
import { ToastService } from '../../../../../core/services/toast.service';
import { UsuarioMock, RolUsuario } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-estampillas-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html'
})
export class EstampillasLoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly configFacade = inject(ConfiguracionFacade);

  readonly isLoading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);

  loginForm: FormGroup = this.fb.group({
    usuario: ['admin', [Validators.required]],
    clave: ['123456', [Validators.required]]
  });

  fillQuickUser(username: string, rol: RolUsuario): void {
    this.loginForm.patchValue({
      usuario: username,
      clave: '123456'
    });
    this.configFacade.cambiarRol(rol);
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
    const { usuario, clave } = this.loginForm.value;

    setTimeout(() => {
      this.isLoading.set(false);
      const usuarios = this.configFacade.usuarios();
      const match = usuarios.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());

      if (match && clave === match.clave) {
        this.configFacade.cambiarUsuario(match);
        this.toast.success(`¡Bienvenido al Módulo de Estampillas, ${match.nombre}!`);
        this.router.navigate(['/estampillas/dashboard']);
      } else {
        // Fallback demo login
        const defaultUser: UsuarioMock = {
          id: `USR-${Date.now()}`,
          usuario: usuario || 'usuario',
          clave: '123456',
          nombre: usuario.toUpperCase() === 'ADMIN' ? 'Administrador Departamental' : 'Funcionario Liquidador',
          cargo: 'Profesional de Rentas y Fiscalización',
          rol: usuario.toUpperCase() === 'ADMIN' ? 'ADMINISTRADOR' : 'LIQUIDADOR',
          email: `${usuario}@cauca.gov.co`,
          dependencia: 'Secretaría de Hacienda Departamental'
        };
        this.configFacade.cambiarUsuario(defaultUser);
        this.toast.success(`Sesión iniciada como: ${defaultUser.nombre}`);
        this.router.navigate(['/estampillas/dashboard']);
      }
    }, 450);
  }
}
