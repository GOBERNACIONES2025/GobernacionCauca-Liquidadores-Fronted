import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SobretasaTopbarComponent } from './sobretasa-topbar/sobretasa-topbar';
import { SobretasaSidebarComponent } from './sobretasa-sidebar/sobretasa-sidebar';

@Component({
  selector: 'app-sobretasa-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SobretasaTopbarComponent, SobretasaSidebarComponent],
  templateUrl: './sobretasa-layout.html',
})
export class SobretasaLayout {
  isSidebarCollapsed = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((v) => !v);
  }
}
