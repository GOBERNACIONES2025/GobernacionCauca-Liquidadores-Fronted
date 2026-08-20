import { Component, output } from '@angular/core';

@Component({
  selector: 'app-registros-topbar',
  standalone: true,
  imports: [],
  templateUrl: './registros-topbar.html',
  styleUrl: './registros-topbar.css',
})
export class RegistrosTopbar {
  readonly toggleSidebar = output<void>();
}

