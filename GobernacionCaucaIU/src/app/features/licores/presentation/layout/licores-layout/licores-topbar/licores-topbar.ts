import { Component, EventEmitter, Output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';
import { LicoresService } from '../../../../application/licores.service';

@Component({
  selector: 'app-licores-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './licores-topbar.html',
})
export class LicoresTopbarComponent {
  readonly authState = inject(AuthStateService);
  private router = inject(Router);
  readonly licoresService = inject(LicoresService);

  @Output() toggleSidebar = new EventEmitter<void>();

  readonly isProfileMenuOpen = signal<boolean>(false);

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((v) => !v);
  }

  currentUser = this.authState.currentUser;

  userName = computed(() => {
    const u = this.currentUser();
    return u?.nombre || 'Funcionario Rentas';
  });

  userRole = computed(() => {
    const u = this.currentUser();
    return u?.roles?.join(', ') || 'Gestor Fiscal ICL';
  });

  userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'FR';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  logout(): void {
    this.authState.clearSession();
    this.router.navigate(['/']);
  }
}
