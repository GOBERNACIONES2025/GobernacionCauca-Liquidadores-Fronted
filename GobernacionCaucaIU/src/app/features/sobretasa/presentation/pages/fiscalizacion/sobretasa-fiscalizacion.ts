import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SobretasaService } from '../../../application/sobretasa.service';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import {
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';
import { SicomValidadorModalComponent } from '../../components/sicom-validador-modal/sicom-validador-modal';
import { ObservacionModalComponent } from '../../components/observacion-modal/observacion-modal';
import { FormularioOficialModalComponent } from '../../components/formulario-oficial-modal/formulario-oficial-modal';
import { PseModalComponent } from '../../components/pse-modal/pse-modal';

@Component({
  selector: 'app-sobretasa-fiscalizacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SicomValidadorModalComponent,
    ObservacionModalComponent,
    FormularioOficialModalComponent,
    PseModalComponent,
  ],
  templateUrl: './sobretasa-fiscalizacion.html',
})
export class SobretasaFiscalizacionComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  // Declaración seleccionada para ver en el panel de detalle
  declaracionSeleccionada = signal<DeclaracionSobretasa | null>(null);

  // Modales
  mostrarModalSicom = signal<boolean>(false);
  mostrarModalObservacion = signal<boolean>(false);
  mostrarModalFormulario = signal<boolean>(false);
  mostrarModalPse = signal<boolean>(false);

  // Filtros
  filtroEstado = 'TODOS';
  busquedaTexto = '';

  // Lista de declaraciones para fiscalización
  declaracionesFiscalizacion = computed(() => {
    let list = this.sobretasaService.declaraciones();

    if (this.filtroEstado !== 'TODOS') {
      list = list.filter((d) => d.estado === this.filtroEstado);
    }

    if (this.busquedaTexto.trim()) {
      const q = this.busquedaTexto.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.numeroRadicado.toLowerCase().includes(q) ||
          d.mayorista.razonSocial.toLowerCase().includes(q) ||
          d.mayorista.nit.includes(q)
      );
    }

    return list;
  });

  ngOnInit(): void {
    const list = this.sobretasaService.declaraciones();
    // Seleccionar por defecto la primera en revisión o la primera de la lista
    const primeraRevision = list.find((d) => d.estado === 'EN_REVISION') || list[0];
    if (primeraRevision) {
      this.declaracionSeleccionada.set(primeraRevision);
    }
  }

  seleccionarDeclaracion(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionada.set(dec);
  }

  abrirValidacionSicom(): void {
    this.mostrarModalSicom.set(true);
  }

  abrirObservacion(): void {
    this.mostrarModalObservacion.set(true);
  }

  aprobarDirecto(): void {
    const dec = this.declaracionSeleccionada();
    if (!dec) return;

    if (confirm(`¿Aprobar la declaración ${dec.numeroRadicado} y habilitar el estado para pago?`)) {
      this.sobretasaService.aprobarDeclaracion(
        dec.id,
        'Dr. Carlos Alberto Medina (Fiscalizador Rentas)',
        'Declaración aprobada tras verificación documental y técnica satisfactoria.'
      );
      // Actualizar selección
      const updated = this.sobretasaService.getDeclaracionById(dec.id);
      if (updated) this.declaracionSeleccionada.set(updated);
    }
  }

  onSicomCompletado(): void {
    this.mostrarModalSicom.set(false);
    const dec = this.declaracionSeleccionada();
    if (dec) {
      const updated = this.sobretasaService.getDeclaracionById(dec.id);
      if (updated) this.declaracionSeleccionada.set(updated);
    }
  }

  onObservacionCompletada(): void {
    this.mostrarModalObservacion.set(false);
    const dec = this.declaracionSeleccionada();
    if (dec) {
      const updated = this.sobretasaService.getDeclaracionById(dec.id);
      if (updated) this.declaracionSeleccionada.set(updated);
    }
  }

  onPagoCompletado(): void {
    this.mostrarModalPse.set(false);
    const dec = this.declaracionSeleccionada();
    if (dec) {
      const updated = this.sobretasaService.getDeclaracionById(dec.id);
      if (updated) this.declaracionSeleccionada.set(updated);
    }
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }
}
