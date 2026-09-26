import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportesRegistrosFacade } from '../../../../application/facades/reportes-registros.facade';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-gobernacion-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './gobernacion-reportes.html',
  styleUrl: './gobernacion-reportes.css'
})
export class GobernacionReportesComponent implements OnInit {
  public facade = inject(ReportesRegistrosFacade);

  // Pestañas del módulo de reportes
  // 1: Detalle de Liquidaciones Fiscales
  // 2: Consolidado por Notaría / Entidad
  // 3: Consolidado por Municipio
  // 4: Resumen de Exenciones y Estados
  activeTab = signal<1 | 2 | 3 | 4>(1);

  ngOnInit(): void {
    this.facade.cargarCatalogosFiltros();
    this.facade.consultarReporte();
  }

  cambiarTab(tab: 1 | 2 | 3 | 4): void {
    this.activeTab.set(tab);
  }

  aplicarFiltros(): void {
    this.facade.pageNumber.set(1);
    this.facade.consultarReporte();
  }

  limpiarFiltros(): void {
    this.facade.limpiarFiltros();
  }

  onPageChange(page: number): void {
    this.facade.cambiarPagina(page);
  }

  descargarExcel(): void {
    this.facade.exportarExcel();
  }

  descargarCSV(): void {
    this.facade.exportarCSV();
  }

  imprimir(): void {
    this.facade.imprimirReporte();
  }
}
