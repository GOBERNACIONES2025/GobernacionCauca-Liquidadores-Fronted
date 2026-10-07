import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthOrchestratorService } from '../../../core/auth/services/auth-orchestrator.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private orchestrator = inject(AuthOrchestratorService);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    usuario: ['', [Validators.required]],
    clave: ['', [Validators.required]],
  });

  // Estado reactivo del componente
  targetModulo = signal<string>('GENERAL');
  returnUrl = signal<string | null>(null);

  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Lectura contextual de queryParams (modulo de origen o returnUrl previo)
    this.route.queryParams.subscribe((params) => {
      if (params['modulo']) {
        this.targetModulo.set(params['modulo'].toUpperCase());
      } else {
        this.targetModulo.set('GENERAL');
      }
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update((val) => !val);
  }

  fillQuickDemo(user: string = 'admin'): void {
    this.loginForm.patchValue({
      usuario: user,
      clave: 'admin123',
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { usuario, clave } = this.loginForm.value;

    this.orchestrator.authenticate(
      { usuario, clave },
      {
        modulo: this.targetModulo(),
      },
      this.returnUrl()
    ).subscribe({
      next: (session) => {
        this.isLoading.set(false);
        this.toastService.success(`¡Bienvenido al sistema, ${session.user.nombre}!`);
      },
      error: (err) => {
        this.isLoading.set(false);
        const friendlyMessage = this.getFriendlyErrorMessage(err);
        this.errorMessage.set(friendlyMessage);
        this.toastService.error(friendlyMessage);
      },
    });
  }

  /**
   * Extrae y genera un mensaje de error limpio y comprensible para el usuario,
   * sin exponer endpoints, URLs internas ni estructuras técnicas del backend.
   */
  private getFriendlyErrorMessage(err: any): string {
    // 1. Mensaje de detalle estructurado desde el backend si no contiene URLs
    if (err?.error && typeof err.error === 'object') {
      const apiMsg = err.error.detail || err.error.message || err.error.Message || err.error.title;
      if (
        apiMsg &&
        typeof apiMsg === 'string' &&
        !apiMsg.includes('Http failure') &&
        !apiMsg.includes('http://') &&
        !apiMsg.includes('https://')
      ) {
        return apiMsg;
      }
    }

    if (
      typeof err?.error === 'string' &&
      err.error.trim().length > 0 &&
      !err.error.includes('<html') &&
      !err.error.includes('http')
    ) {
      return err.error;
    }

    // 2. Mapeo seguro por código de estado HTTP
    switch (err?.status) {
      case 400:
        return 'Solicitud de autenticación inválida. Por favor verifique los datos ingresados.';
      case 401:
      case 403:
        return 'Credenciales inválidas. Por favor verifique su usuario y contraseña.';
      case 404:
        return 'El servicio de autenticación para este módulo no se encuentra disponible. Intente más tarde.';
      case 500:
      case 502:
      case 503:
        return 'El servidor de autenticación experimenta inconvenientes técnicos. Por favor intente más tarde.';
      case 0:
        return 'No fue posible conectar con el servidor. Verifique su conexión o el estado del servicio.';
      default:
        return 'Credenciales inválidas o servicio no disponible. Por favor verifique sus datos.';
    }
  }
}