import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegistrosSidebar } from './registros-sidebar/registros-sidebar';
import { RegistrosTopbar } from './registros-topbar/registros-topbar';

@Component({
  selector: 'app-registros-layout',
  imports: [RouterModule, RegistrosSidebar, RegistrosTopbar],
  templateUrl: './registros-layout.html',
  styleUrl: './registros-layout.css'
})
export class RegistrosLayoutComponent {

}
