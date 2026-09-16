import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-deguello-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deguello-sidebar.html',
})
export class DeguelloSidebar {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();
}
