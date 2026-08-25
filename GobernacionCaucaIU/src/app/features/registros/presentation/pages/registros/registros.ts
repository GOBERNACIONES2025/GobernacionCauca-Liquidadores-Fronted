import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistrosListComponent } from './components/registros-list/registros-list';
import { LiquidacionWizardComponent } from './components/liquidacion-wizard/liquidacion-wizard';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, RegistrosListComponent, LiquidacionWizardComponent],
  templateUrl: './registros.html'
})
export class Registros {
  // 'list' para mostrar la tabla, 'wizard' para mostrar el asistente
  viewMode = signal<'list' | 'wizard'>('list');

  iniciarNuevaSolicitud() {
    this.viewMode.set('wizard');
  }

  cancelarWizard() {
    this.viewMode.set('list');
  }
}
