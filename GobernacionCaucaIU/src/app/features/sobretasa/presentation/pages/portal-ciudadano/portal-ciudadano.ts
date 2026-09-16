import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SobretasaService } from '../../../application/sobretasa.service';
import { DeclaracionSobretasa } from '../../../domain/models/sobretasa-gasolina.models';
import {
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';
import { FormularioOficialModalComponent } from '../../components/formulario-oficial-modal/formulario-oficial-modal';
import { DeclaracionWizardComponent } from '../../components/declaracion-wizard/declaracion-wizard';
import { PseModalComponent } from '../../components/pse-modal/pse-modal';

@Component({
  selector: 'app-sobretasa-portal-ciudadano',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormularioOficialModalComponent,
    DeclaracionWizardComponent,
    PseModalComponent,
  ],
  templateUrl: './portal-ciudadano.html',
})
export class SobretasaPortalCiudadanoComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  // Modales
  mostrarWizard = signal<boolean>(false);
  declaracionSeleccionadaParaFormulario = signal<DeclaracionSobretasa | null>(null);
  declaracionSeleccionadaParaPagar = signal<DeclaracionSobretasa | null>(null);
  declaracionSeleccionadaParaSubsanar = signal<DeclaracionSobretasa | null>(null);

  // Subsanación modal
  observacionSubsanacionTexto = '';

  // Filtro de consulta rápida por radicado
  busquedaRadicado = '';
  declaracionConsultada = signal<DeclaracionSobretasa | null>(null);
  busquedaRealizada = false;

  // Filtros de tabla
  filtroEstado = 'TODOS';
  filtroMes = 'TODOS';

  meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  declaracionesFiltradas = computed(() => {
    let list = this.sobretasaService.declaracionesMayorista();

    if (this.filtroEstado !== 'TODOS') {
      list = list.filter((d) => d.estado === this.filtroEstado);
    }

    if (this.filtroMes !== 'TODOS') {
      const mesNum = parseInt(this.filtroMes, 10);
      list = list.filter((d) => d.periodoMes === mesNum);
    }

    return list;
  });

  cambiarMayorista(id: string): void {
    this.sobretasaService.setSelectedMayorista(id);
  }

  consultarRadicado(): void {
    if (!this.busquedaRadicado.trim()) return;
    this.busquedaRealizada = true;
    const dec = this.sobretasaService.getDeclaracionById(this.busquedaRadicado);
    this.declaracionConsultada.set(dec || null);
  }

  abrirSubsanacion(dec: DeclaracionSobretasa): void {
    this.declaracionSeleccionadaParaSubsanar.set(dec);
    this.observacionSubsanacionTexto = '';
  }

  confirmarSubsanacion(): void {
    const dec = this.declaracionSeleccionadaParaSubsanar();
    if (!dec) return;

    if (!this.observacionSubsanacionTexto.trim()) {
      alert('Por favor ingrese el detalle de la corrección realizada.');
      return;
    }

    // Subsanar con los mismos despachos o reajustados
    this.sobretasaService.subsanarDeclaracion(
      dec.id,
      dec.despachos,
      this.observacionSubsanacionTexto
    );
    this.declaracionSeleccionadaParaSubsanar.set(null);
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }

  getNombreMes(mes: number): string {
    const m = this.meses.find((item) => item.num === mes);
    return m ? m.nombre : `Mes ${mes}`;
  }
}
