import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LicoresTopbarComponent } from './licores-topbar/licores-topbar';
import { LicoresSidebarComponent } from './licores-sidebar/licores-sidebar';

@Component({
  selector: 'app-licores-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LicoresTopbarComponent, LicoresSidebarComponent],
  templateUrl: './licores-layout.html',
})
export class LicoresLayout {
  isSidebarCollapsed = signal<boolean>(false);
  isSidebarHovered = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }
}
