import { Component, EventEmitter, Output, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';
import { SobretasaService } from '../../../../application/sobretasa.service';

@Component({
  selector: 'app-sobretasa-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './sobretasa-topbar.html',
})
export class SobretasaTopbarComponent {
  readonly authState = inject(AuthStateService);
  private router = inject(Router);
  readonly sobretasaService = inject(SobretasaService);

  @Output() toggleSidebar = new EventEmitter<void>();

  readonly isProfileMenuOpen = signal<boolean>(false);

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((v) => !v);
  }

  currentUser = this.authState.currentUser;

  userName = computed(() => {
    const u = this.currentUser();
    return u?.nombre || 'Funcionario Hacienda';
  });

  userRole = computed(() => {
    const u = this.currentUser();
    return u?.roles?.join(', ') || 'Fiscalizador de Sobretasa';
  });

  userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'FH';
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
