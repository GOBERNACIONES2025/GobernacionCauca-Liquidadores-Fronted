import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstampillasSidebarComponent } from '../estampillas-sidebar/estampillas-sidebar';
import { EstampillasTopbarComponent } from '../estampillas-topbar/estampillas-topbar';

@Component({
  selector: 'app-estampillas-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, EstampillasSidebarComponent, EstampillasTopbarComponent],
  templateUrl: './estampillas-layout.html',
  styleUrls: ['./estampillas-layout.css']
})
export class EstampillasLayoutComponent {
  isSidebarCollapsed = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }
}
