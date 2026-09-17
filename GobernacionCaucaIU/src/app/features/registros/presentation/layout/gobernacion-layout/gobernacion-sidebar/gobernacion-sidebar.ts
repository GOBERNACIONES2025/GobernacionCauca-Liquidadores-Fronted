import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gobernacion-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gobernacion-sidebar.html',
  styleUrl: './gobernacion-sidebar.css'
})
export class GobernacionSidebarComponent {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();
}
