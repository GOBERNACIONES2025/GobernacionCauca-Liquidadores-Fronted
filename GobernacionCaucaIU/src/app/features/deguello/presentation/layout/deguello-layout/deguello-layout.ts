import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeguelloTopbar } from './deguello-topbar/deguello-topbar';
import { DeguelloSidebar } from './deguello-sidebar/deguello-sidebar';

@Component({
  selector: 'app-deguello-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, DeguelloTopbar, DeguelloSidebar],
  templateUrl: './deguello-layout.html',
})
export class DeguelloLayoutComponent {
  isSidebarCollapsed = signal<boolean>(false);
  isSidebarHovered = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }
}
