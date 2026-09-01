import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PasaportesAdminAuthService } from '../../../../application/auth/pasaportes-admin-auth.service';

@Component({
  selector: 'app-pasaportes-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pasaportes-admin-login.html',
})
export class PasaportesAdminLogin {
  private readonly auth = inject(PasaportesAdminAuthService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    remember: new FormControl(false, { nonNullable: true }),
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    const { username, password, remember } = this.form.getRawValue();
    this.auth.login(username, password, remember).subscribe({
      next: (result) => {
        if (result.success) {
          void this.router.navigate(['/pasaportes/admin']);
        } else {
          this.errorMessage.set(result.message ?? 'No fue posible iniciar sesión.');
        }
      },
      error: () => this.errorMessage.set('No fue posible iniciar sesión. Inténtelo nuevamente.'),
      complete: () => this.submitting.set(false),
    });
  }
}
