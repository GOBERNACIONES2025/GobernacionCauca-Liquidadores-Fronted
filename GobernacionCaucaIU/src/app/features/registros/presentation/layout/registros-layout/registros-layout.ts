import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  isSidebarCollapsed = signal<boolean>(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }
}

