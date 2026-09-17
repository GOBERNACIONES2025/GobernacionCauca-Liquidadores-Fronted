import { Component, inject, computed, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthStateService } from '../../../../../../core/auth/auth-state.service';
import { BreadcrumbComponent } from '../../../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-gobernacion-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent],
  templateUrl: './gobernacion-topbar.html',
  styleUrl: './gobernacion-topbar.css'
})
export class GobernacionTopbarComponent {
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
    return u?.nombre || 'Liquidador Departamental';
  });

  userRole = computed(() => {
    return 'Fiscalización y Rentas Departamentales';
  });

  userInitials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'LD';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  logout() {
    this.authState.clearSession();
    this.router.navigate(['/registros/gobernacion/login']);
  }
}
