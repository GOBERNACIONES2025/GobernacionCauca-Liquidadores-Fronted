import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RegistrosSidebar } from './registros-sidebar/registros-sidebar';
import { RegistrosTopbar } from './registros-topbar/registros-topbar';

@Component({
  selector: 'app-registros-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RegistrosSidebar, RegistrosTopbar],
  templateUrl: './registros-layout.html',
  styleUrl: './registros-layout.css'
})
export class RegistrosLayoutComponent {
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(true);
  isSidebarHovered = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/registros/configuracion')) {
        this.isSidebarCollapsed.set(true);
      }
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}

