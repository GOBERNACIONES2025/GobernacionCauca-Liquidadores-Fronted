import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-automotores-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './automotores-layout.html'
})
export class AutomotoresLayout {
  readonly isSidebarOpen = signal<boolean>(true);
  readonly isConfigOpen = signal<boolean>(false);
  readonly isProfileMenuOpen = signal<boolean>(false);
  readonly activeConfigTab = signal<string>('general');

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  toggleConfig(): void {
    const nextState = !this.isConfigOpen();
    this.isConfigOpen.set(nextState);
    if (nextState) {
      // Ocultar únicamente con los iconos el sidebar principal
      this.isSidebarOpen.set(false);
    } else {
      // Restaurar el sidebar principal al cerrar configuración
      this.isSidebarOpen.set(true);
    }
  }

  closeConfig(): void {
    this.isConfigOpen.set(false);
    this.isSidebarOpen.set(true);
  }

  selectConfigTab(tab: string): void {
    this.activeConfigTab.set(tab);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(v => !v);
  }
}
