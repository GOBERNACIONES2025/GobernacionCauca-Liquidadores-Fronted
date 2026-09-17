import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-entidades-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './entidades-topbar.html',
  styleUrl: './entidades-topbar.css'
})
export class EntidadesTopbarComponent {
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
    return u?.nombre || 'Notaría 1 de Popayán';
  });

  userRole = computed(() => {
    return 'Entidad Registral Externa';
  });

  userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'NE';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  logout() {
    this.authState.clearSession();
    this.router.navigate(['/registros/entidades/login']);
  }
}
