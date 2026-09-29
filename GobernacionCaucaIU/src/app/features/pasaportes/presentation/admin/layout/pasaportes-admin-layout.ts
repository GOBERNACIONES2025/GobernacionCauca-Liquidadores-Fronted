import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from '../../../../../core/auth/auth-state.service';

@Component({
  selector: 'app-pasaportes-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './pasaportes-admin-layout.html',
})
export class PasaportesAdminLayout {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly isSidebarOpen = signal(false);
  readonly isSidebarHovered = signal(false);
  readonly isProfileMenuOpen = signal(false);
  readonly currentUser = this.authState.currentUser;

  readonly userName = computed(() => this.currentUser()?.nombre || 'Usuario');
  readonly userRole = computed(() => this.currentUser()?.roles?.join(', ') || 'Administrador de Pasaportes');
  readonly userInitials = computed(() => {
    const parts = this.userName().trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'US').slice(0, 2).toUpperCase();
  });

  toggleSidebar(): void {
    this.isSidebarOpen.update((value) => !value);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((value) => !value);
  }

  goToLiquidadores(): void {
    this.isProfileMenuOpen.set(false);
    void this.router.navigateByUrl('/');
  }

  logout(): void {
    this.isProfileMenuOpen.set(false);
    this.authState.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
