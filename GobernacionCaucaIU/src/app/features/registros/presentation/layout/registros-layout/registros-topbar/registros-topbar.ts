import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';

@Component({
  selector: 'app-registros-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registros-topbar.html',
  styleUrl: './registros-topbar.css',
})

export class RegistrosTopbar {
  private authState = inject(AuthStateService);
  private router = inject(Router);

  readonly toggleSidebar = output<void>();
  readonly isProfileMenuOpen = signal(false);

  toggleProfileMenu() {
    this.isProfileMenuOpen.update(v => !v);
  }

  currentUser = this.authState.currentUser;

  userName = computed(() => {
    const u = this.currentUser();
    return u?.nombre || 'Usuario';
  });

  userRole = computed(() => {
    const u = this.currentUser();
    return u?.roles?.join(', ') || 'Liquidador de Registro';
  });


  userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'US';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  currentFormattedDate = computed(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · Vigencia 2025`;
  });

  pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('configuracion')) {
      return 'Configuración de Registros';
    }
    return 'Dashboard';
  });

  logout() {
    this.authState.clearSession();
    this.router.navigate(['/']);
  }
}


