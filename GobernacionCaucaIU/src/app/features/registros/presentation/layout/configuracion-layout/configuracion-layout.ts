import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfigSidebar } from './config-sidebar/config-sidebar';

@Component({
  selector: 'app-configuracion-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfigSidebar],
  templateUrl: './configuracion-layout.html',
  styleUrl: './configuracion-layout.css'
})
export class ConfiguracionLayoutComponent {
  isMobileSidebarOpen = signal<boolean>(false);

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }
}

