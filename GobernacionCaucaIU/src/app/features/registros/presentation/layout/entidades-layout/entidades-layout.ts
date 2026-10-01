import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EntidadesSidebarComponent } from './entidades-sidebar/entidades-sidebar';
import { EntidadesTopbarComponent } from './entidades-topbar/entidades-topbar';

@Component({
  selector: 'app-entidades-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, EntidadesSidebarComponent, EntidadesTopbarComponent],
  templateUrl: './entidades-layout.html',
  styleUrl: './entidades-layout.css'
})
export class EntidadesLayoutComponent {
  isSidebarCollapsed = signal<boolean>(false);
  isSidebarHovered = signal<boolean>(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}
