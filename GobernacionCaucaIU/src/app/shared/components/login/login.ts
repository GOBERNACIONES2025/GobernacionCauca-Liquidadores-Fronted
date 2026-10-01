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
  targetModulo = signal<string>('REGISTROS');
  returnUrl = signal<string | null>(null);

  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Lectura contextual de queryParams (modulo de origen o returnUrl previo)
    this.route.queryParams.subscribe((params) => {
      if (params['modulo']) {
        this.targetModulo.set(params['modulo'].toUpperCase());
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
        const detail =
          err?.error?.detail ||
          err?.error?.title ||
          err?.error?.message ||
          err?.message ||
          'Credenciales inválidas. Por favor verifique su usuario y contraseña.';
        this.errorMessage.set(detail);
        this.toastService.error(detail);
      },
    });
  }
}