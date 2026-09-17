import { Component, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-deguello-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deguello-topbar.html',
})
export class DeguelloTopbar {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly toggleSidebar = output<void>();
  readonly isProfileMenuOpen = signal<boolean>(false);

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
