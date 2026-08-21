import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { PasaportesAdminAuthService } from '../../application/auth/pasaportes-admin-auth.service';

@Component({
  selector: 'app-pasaportes-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  templateUrl: './pasaportes-layout.html',
})
export class PasaportesLayout {
  private readonly router = inject(Router);
  private readonly adminAuth = inject(PasaportesAdminAuthService);

  get isAdminDashboard(): boolean {
    return this.router.url.split('?')[0] === '/pasaportes/admin';
  }

  logout(destination: 'login' | 'liquidadores'): void {
    this.adminAuth.logout(destination);
  }
}
