import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportesFacade } from '../../../application/facades/reportes.facade';
import { TipoReporte } from '../../../domain/models/reporte.model';
import { VehiculoItemDto } from '../../../domain/interfaces/vehiculo.interface';
import { PropietarioDto } from '../../../domain/interfaces/propietario.interface';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class ReportesPage {
  readonly facade = inject(ReportesFacade);

  readonly tiposVehiculo = [
    'Todos',
    'AUTOMOVILES',
    'CAMPEROS',
    'CAMIONETAS',
    'MOTOCICLETAS',
    'MOTOCARROS',
    'BUSES Y BUSETAS',
    'CAMIONES',
    'TRACTOCAMIONES'
  ];

  readonly estadosMatricula = [
    'Todos',
    'Matrícula Activa',
    'Cancelada',
    'Trasladada',
    'Radicada'
  ];

  readonly estadosContribuyente = [
    'Todos',
    'Activos',
    'Inactivos'
  ];

  readonly situacionesContribuyente = [
    'Todos',
    'Al Día',
    'Con Deuda'
  ];

  seleccionarTab(tab: TipoReporte): void {
    this.facade.cambiarTab(tab);
  }

  aplicarFiltros(): void {
    this.facade.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.facade.limpiarFiltros();
  }

  cambiarPagina(pagina: number): void {
    this.facade.cambiarPagina(pagina);
  }

  descargarExcel(): void {
    this.facade.descargarReporteActual();
  }

  // Helpers de formato para la tabla de previsualización
  getTipoDocNombre(id: number): string {
    switch (id) {
      case 1: return 'CC';
      case 2: return 'NIT';
      case 3: return 'CE';
      case 4: return 'PASAPORTE';
      case 5: return 'TI';
      default: return 'DOC';
    }
  }

  getNombreCompletoContribuyente(c: PropietarioDto): string {
    if (c.razonSocial && c.razonSocial.trim()) return c.razonSocial;
    const partes = [c.primerNombre, c.segundoNombre, c.primerApellido, c.segundoApellido].filter(Boolean);
    return partes.length > 0 ? partes.join(' ') : 'Sin nombre registrado';
  }

  getDocumentoFormateado(c: PropietarioDto): string {
    const tipo = this.getTipoDocNombre(c.tipoDocumentoId);
    const dv = c.digitoVerificacion ? `-${c.digitoVerificacion}` : '';
    return `${tipo} ${c.numeroDocumento}${dv}`;
  }

  getEstadoVehiculoBadgeClass(estado?: string): string {
    switch ((estado || '').toLowerCase()) {
      case 'matrícula activa':
      case 'activa':
      case 'activo':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelada':
      case 'inactivo':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'trasladada':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }
}
