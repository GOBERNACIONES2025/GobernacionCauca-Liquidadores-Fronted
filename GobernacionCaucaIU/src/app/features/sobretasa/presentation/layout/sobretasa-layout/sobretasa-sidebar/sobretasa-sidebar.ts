import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SobretasaService } from '../../../../application/sobretasa.service';

@Component({
  selector: 'app-sobretasa-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sobretasa-sidebar.html',
})
export class SobretasaSidebarComponent {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  readonly sobretasaService = inject(SobretasaService);
}
