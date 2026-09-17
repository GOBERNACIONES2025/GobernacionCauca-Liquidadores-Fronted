import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
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
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    usuario: ['notaria1_popayan', [Validators.required]],
    clave: ['notaria123', [Validators.required]],
    entidadId: [1]
  });

  isLoading = signal(false);
  showPassword = signal(false);

  fillDemo(nombre: string, user: string, entidadId: number): void {
    this.loginForm.patchValue({
      usuario: user,
      clave: 'clave123',
      entidadId: entidadId
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
    const { usuario, entidadId } = this.loginForm.value;

    setTimeout(() => {
      this.isLoading.set(false);
      let entidadNombre = 'Notaría 1 de Popayán';
      if (usuario.includes('notaria2')) entidadNombre = 'Notaría 2 de Popayán';
      if (usuario.includes('camara')) entidadNombre = 'Cámara de Comercio del Cauca';
      if (usuario.includes('orip')) entidadNombre = 'Oficina de Registro de Instrumentos Públicos';

      const mockUser = {
        id: entidadId || 1,
        nombre: entidadNombre,
        email: `${usuario}@notariascauca.gov.co`,
        roles: ['NOTARIA', 'ENTIDAD_EXTERNA']
      };

      this.authState.setSession(mockUser, 'REGISTROS');
      this.toast.success(`¡Bienvenido al Portal Notarial, ${entidadNombre}!`);
      this.router.navigate(['/registros/entidades/solicitudes']);
    }, 400);
  }
}
