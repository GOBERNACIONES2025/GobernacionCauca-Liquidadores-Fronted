import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';
import { BreadcrumbService } from '../../../../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-registros-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './registros-topbar.html',
  styleUrl: './registros-topbar.css',
})
export class RegistrosTopbar {
  private authState = inject(AuthStateService);
  private router = inject(Router);
  public breadcrumbService = inject(BreadcrumbService);

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

  logout() {
    this.authState.clearSession();
    this.router.navigate(['/']);
  }
}
