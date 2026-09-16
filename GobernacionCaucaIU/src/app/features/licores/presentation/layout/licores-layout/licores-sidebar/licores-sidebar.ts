import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LicoresService } from '../../../../application/licores.service';

@Component({
  selector: 'app-licores-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './licores-sidebar.html',
})
export class LicoresSidebarComponent {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly licoresService = inject(LicoresService);
}
