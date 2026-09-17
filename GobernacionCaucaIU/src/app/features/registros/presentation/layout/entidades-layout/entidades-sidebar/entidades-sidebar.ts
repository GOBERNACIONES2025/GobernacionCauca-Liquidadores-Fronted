import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-entidades-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './entidades-sidebar.html',
  styleUrl: './entidades-sidebar.css'
})
export class EntidadesSidebarComponent {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();
}
