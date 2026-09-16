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
import { FormularioOficialModalComponent } from '../../components/formulario-oficial-modal/formulario-oficial-modal';

@Component({
  selector: 'app-sobretasa-declaraciones',
  standalone: true,
  imports: [CommonModule, FormsModule, FormularioOficialModalComponent],
  templateUrl: './sobretasa-declaraciones.html',
})
export class SobretasaDeclaracionesComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;

  // Modales
  declaracionSeleccionadaParaFormulario = signal<DeclaracionSobretasa | null>(null);

  // Filtros
  filtroMayorista = 'TODOS';
  filtroEstado = 'TODOS';
  filtroMes = 'TODOS';
  busquedaRadicado = '';

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
    let list = this.sobretasaService.declaraciones();

    if (this.filtroMayorista !== 'TODOS') {
      list = list.filter((d) => d.mayoristaId === this.filtroMayorista);
    }

    if (this.filtroEstado !== 'TODOS') {
      list = list.filter((d) => d.estado === this.filtroEstado);
    }

    if (this.filtroMes !== 'TODOS') {
      const mesNum = parseInt(this.filtroMes, 10);
      list = list.filter((d) => d.periodoMes === mesNum);
    }

    if (this.busquedaRadicado.trim()) {
      const q = this.busquedaRadicado.toLowerCase().trim();
      list = list.filter((d) => d.numeroRadicado.toLowerCase().includes(q));
    }

    return list;
  });

  exportarCsv(): void {
    const list = this.declaracionesFiltradas();
    const rows = [
      ['Radicado', 'Mayorista', 'NIT', 'Mes', 'Anio', 'Galones_GMC', 'Galones_GME', 'Galones_ACPM', 'Total_Galones', 'Municipal', 'Departamental', 'Total_Pagar', 'Estado', 'Fecha_Radicacion'],
      ...list.map(d => [
        d.numeroRadicado,
        d.mayorista.razonSocial,
        d.mayorista.nit,
        d.periodoMes,
        d.periodoAnio,
        d.totalGalonesGMC,
        d.totalGalonesGME,
        d.totalGalonesACPM,
        d.totalGalonesGeneral,
        d.totalMunicipal,
        d.totalDepartamental,
        d.totalPagar,
        d.estado,
        d.fechaRadicacion
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_sobretasa_cauca_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
