import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-automotores-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BreadcrumbComponent],
  templateUrl: './automotores-layout.html'
})
export class AutomotoresLayout {
  private router = inject(Router);
  public breadcrumbService = inject(BreadcrumbService);

  readonly isSidebarOpen = signal<boolean>(false);
  readonly isSidebarHovered = signal<boolean>(false);
  readonly isProfileMenuOpen = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.url.includes('/automotores/configuracion')) {
        this.isSidebarOpen.set(false);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(v => !v);
  }
}
