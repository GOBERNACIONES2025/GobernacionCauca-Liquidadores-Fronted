import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { GobernacionSidebarComponent } from './gobernacion-sidebar/gobernacion-sidebar';
import { GobernacionTopbarComponent } from './gobernacion-topbar/gobernacion-topbar';

@Component({
  selector: 'app-gobernacion-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, GobernacionSidebarComponent, GobernacionTopbarComponent],
  templateUrl: './gobernacion-layout.html',
  styleUrl: './gobernacion-layout.css'
})
export class GobernacionLayoutComponent {
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(false);
  isSidebarHovered = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/registros/gobernacion/configuracion')) {
        this.isSidebarCollapsed.set(true);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}
