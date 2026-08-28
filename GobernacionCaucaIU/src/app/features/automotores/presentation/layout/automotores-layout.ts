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
  readonly isProfileMenuOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.update(v => !v);
  }
}
