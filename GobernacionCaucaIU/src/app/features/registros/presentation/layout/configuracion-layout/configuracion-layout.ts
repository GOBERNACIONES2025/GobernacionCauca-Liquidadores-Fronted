import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ConfigSidebar } from './config-sidebar/config-sidebar';

@Component({
  selector: 'app-configuracion-layout',
  imports: [RouterModule, ConfigSidebar],
  templateUrl: './configuracion-layout.html',
  styleUrl: './configuracion-layout.css'
})
export class ConfiguracionLayoutComponent {

}
