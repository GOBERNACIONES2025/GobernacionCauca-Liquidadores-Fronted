import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registros-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registros-sidebar.html',
  styleUrl: './registros-sidebar.css',
})
export class RegistrosSidebar {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();
}

