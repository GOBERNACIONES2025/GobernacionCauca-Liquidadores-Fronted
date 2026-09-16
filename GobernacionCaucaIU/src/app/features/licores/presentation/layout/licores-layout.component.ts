import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { LicoresService, RolUsuarioLicores } from '../../application/licores.service';

@Component({
  selector: 'app-licores-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './licores-layout.component.html',
})
export class LicoresLayoutComponent {
  readonly licoresService = inject(LicoresService);
  private router = inject(Router);

  cambiarRol(rol: RolUsuarioLicores): void {
    this.licoresService.cambiarRol(rol);
    if (rol === 'CONTRIBUYENTE') {
      this.router.navigate(['/licores/contribuyente']);
    } else {
      this.router.navigate(['/licores/rentas']);
    }
  }
}
