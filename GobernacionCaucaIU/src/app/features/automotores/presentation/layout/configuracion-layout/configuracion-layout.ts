import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AutomotoresConfigSidebar } from './config-sidebar/config-sidebar';

@Component({
  selector: 'app-automotores-configuracion-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AutomotoresConfigSidebar],
  templateUrl: './configuracion-layout.html',
  styleUrl: './configuracion-layout.css'
})
export class AutomotoresConfiguracionLayout {
  readonly isMobileSidebarOpen = signal<boolean>(false);

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }
}
