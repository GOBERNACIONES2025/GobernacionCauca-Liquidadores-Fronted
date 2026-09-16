import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import { SobretasaService } from '../../../application/sobretasa.service';

@Component({
  selector: 'app-observacion-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './observacion-modal.html',
})
export class ObservacionModalComponent {
  private sobretasaService = inject(SobretasaService);

  @Input() declaracion!: DeclaracionSobretasa;
  @Output() cerrar = new EventEmitter<void>();
  @Output() observacionGuardada = new EventEmitter<void>();

  causalesPredefinidas = [
    'Discrepancia en volumen de galones frente al reporte mensual consolidado de SICOM.',
    'Guía de transporte SICOM no registrada o con fecha fuera del periodo gravable.',
    'Código SICOM de la Estación de Servicio (EDS) no corresponde a la jurisdicción del Cauca.',
    'Diferencia en el cálculo de la porción municipal respecto al destino de entrega.',
    'Soporte de pago o radicación extemporánea sin liquidación de la sanción de ley.',
  ];

  motivoSeleccionado = this.causalesPredefinidas[0];
  observacionDetallada = '';
  funcionarioResponsable = 'Dra. María Elena Restrepo (Auditora Tributaria)';

  guardarObservacion(): void {
    const textoFinal = `${this.motivoSeleccionado}. ${this.observacionDetallada}`.trim();
    this.sobretasaService.observarDeclaracion(
      this.declaracion.id,
      this.funcionarioResponsable,
      textoFinal
    );
    this.observacionGuardada.emit();
  }
}
