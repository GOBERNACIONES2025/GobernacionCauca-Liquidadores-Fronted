import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import { SobretasaService } from '../../../application/sobretasa.service';
import { formatGalones, formatMoneyCop } from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-sicom-validador-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sicom-validador-modal.html',
})
export class SicomValidadorModalComponent implements OnInit {
  private sobretasaService = inject(SobretasaService);

  @Input() declaracion!: DeclaracionSobretasa;
  @Output() cerrar = new EventEmitter<void>();
  @Output() validacionCompletada = new EventEmitter<void>();

  validando = false;
  porcentajeProgreso = 0;
  estadoValidacion: 'PENDIENTE' | 'VALIDANDO' | 'COMPLETADO' = 'PENDIENTE';

  ngOnInit(): void {
    if (this.declaracion.validacionSicomCompleta) {
      this.estadoValidacion = 'COMPLETADO';
      this.porcentajeProgreso = 100;
    }
  }

  iniciarValidacionSicom(): void {
    this.validando = true;
    this.estadoValidacion = 'VALIDANDO';
    this.porcentajeProgreso = 15;

    const interval = setInterval(() => {
      this.porcentajeProgreso += 25;
      if (this.porcentajeProgreso >= 100) {
        clearInterval(interval);
        this.porcentajeProgreso = 100;
        this.validando = false;
        this.estadoValidacion = 'COMPLETADO';
        this.sobretasaService.validarSicomDeclaracion(this.declaracion.id);
        this.validacionCompletada.emit();
      }
    }, 400);
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }
}
