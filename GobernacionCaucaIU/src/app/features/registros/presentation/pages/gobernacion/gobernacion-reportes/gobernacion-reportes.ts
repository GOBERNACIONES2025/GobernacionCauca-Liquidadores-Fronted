import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReportesRegistrosFacade, RangoFechaRapido } from '../../../../application/facades/reportes-registros.facade';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { SearchableSelectComponent } from '../../../../../../shared/components/searchable-select/searchable-select';
import { ToastService } from '../../../../../../core/services/toast.service';

@Component({
  selector: 'app-gobernacion-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent, SearchableSelectComponent],
  templateUrl: './gobernacion-reportes.html',
  styleUrl: './gobernacion-reportes.css'
})
export class GobernacionReportesComponent implements OnInit {
  public facade = inject(ReportesRegistrosFacade);
  private toast = inject(ToastService);

  // Delegados para selects buscables y paginados
  searchMunicipiosFn = (term: string) => this.facade.buscarMunicipios(term);
  resolveMunicipioFn = (id: any) => this.facade.resolverMunicipio(id);

  searchTiposEntidadFn = (term: string) => this.facade.buscarTiposEntidad(term);
  resolveTipoEntidadFn = (id: any) => this.facade.resolverTipoEntidad(id);

  searchEntidadesFn = (term: string) => this.facade.buscarEntidades(term);
  resolveEntidadFn = (id: any) => this.facade.resolverEntidad(id);

  searchTiposActoFn = (term: string) => this.facade.buscarTiposActo(term);
  resolveTipoActoFn = (id: any) => this.facade.resolverTipoActo(id);

  // Manejadores reactivos de cambio en cascada
  onMunicipioChange(val: any): void {
    this.facade.setFiltroMunicipio(val);
  }

  onTipoEntidadChange(val: any): void {
    this.facade.setFiltroTipoEntidad(val);
  }

  onEntidadChange(val: any): void {
    this.facade.setFiltroEntidad(val);
  }

  onTipoActoChange(val: any): void {
    this.facade.setFiltroTipoActo(val);
  }

  // Pestañas del módulo de reportes y auditoría:
  // 1: Detalle de Liquidaciones Fiscales
  // 2: Consolidado por Notaría / Entidad
  // 3: Consolidado por Municipio Jurisdicción
  // 4: Distribución y Análisis por Estados
  activeTab = signal<1 | 2 | 3 | 4>(1);

  // Estados para Modal de Comprobante / Constancia de Pago Oficial
  showComprobanteModal = signal<boolean>(false);
  selectedLiquidacion = signal<any | null>(null);
  selectedComprobante = signal<any | null>(null);
  isLoadingComprobante = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.facade.cargarCatalogosFiltros();
    this.facade.consultarReporte();
  }

  cambiarTab(tab: 1 | 2 | 3 | 4): void {
    this.activeTab.set(tab);
  }

  aplicarFiltros(): void {
    this.facade.consultarReporte();
  }

  limpiarFiltros(): void {
    this.facade.limpiarFiltros();
  }

  setRangoFechaRapido(rango: RangoFechaRapido): void {
    this.facade.aplicarRangoFechaRapido(rango);
  }

  ordenar(columna: string): void {
    this.facade.ordenarPor(columna);
  }

  onPageChange(page: number): void {
    this.facade.cambiarPagina(page);
  }

  onPageSizeChange(size: number): void {
    this.facade.cambiarTamanoPagina(size);
  }

  // ── DESCARGA DE PDF OFICIAL DE LIQUIDACIÓN ────────────────────────────
  descargarPdf(id: number): void {
    this.toast.info('Descargando liquidación oficial...');
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_Oficial_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Archivo fiscal descargado exitosamente');
      },
      error: () => this.toast.error('No se pudo descargar el PDF de la liquidación seleccionada.')
    });
  }

  // ── VISUALIZACIÓN DE CONSTANCIA DE RECAUDO / PAGO ─────────────────────
  verComprobante(liq: any): void {
    this.selectedLiquidacion.set(liq);
    this.isLoadingComprobante.set(true);
    this.showComprobanteModal.set(true);

    this.facade.obtenerPago(liq.id).subscribe({
      next: (res) => {
        this.isLoadingComprobante.set(false);
        this.selectedComprobante.set(res.data);
      },
      error: () => {
        this.isLoadingComprobante.set(false);
        this.toast.error('No se pudo cargar la constancia oficial de recaudo.');
      }
    });
  }

  descargarSoporte(liqId: number): void {
    this.facade.descargarSoportePago(liqId, false).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Soporte_Pago_Liq_${liqId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Soporte bancario descargado');
      },
      error: () => this.toast.error('Error al descargar el comprobante bancario.')
    });
  }

  // ── DRILLDOWN INTERACTIVO ENTRE PESTAÑAS ──────────────────────────────
  filtrarPorEntidadDesdeResumen(nombreEntidad: string): void {
    const ent = this.facade.entidades().find(e => e.nombre?.toLowerCase().trim() === nombreEntidad.toLowerCase().trim());
    if (ent) {
      this.facade.setFiltroEntidad(ent.id);
      this.facade.consultarReporte();
      this.activeTab.set(1);
      this.toast.info(`Filtrando liquidaciones para: ${ent.nombre}`);
    }
  }

  filtrarPorMunicipioDesdeResumen(nombreMun: string): void {
    const mun = this.facade.municipios().find(m => m.nombre?.toLowerCase().trim() === nombreMun.toLowerCase().trim());
    if (mun) {
      this.facade.setFiltroMunicipio(mun.id);
      this.facade.consultarReporte();
      this.activeTab.set(1);
      this.toast.info(`Filtrando liquidaciones para municipio: ${mun.nombre}`);
    }
  }

  filtrarPorEstadoDesdeResumen(codigoEstado: string): void {
    this.facade.setFiltroEstado(codigoEstado);
    this.facade.consultarReporte();
    this.activeTab.set(1);
    this.toast.info(`Filtrando liquidaciones por estado: ${codigoEstado.toUpperCase()}`);
  }

  copiarAlPortapapeles(texto: string | null | undefined, label: string): void {
    if (!texto || texto === '-') return;
    navigator.clipboard.writeText(texto).then(() => {
      this.toast.success(`${label} copiado al portapapeles: ${texto}`);
    }).catch(() => {
      this.toast.info(`Dato: ${texto}`);
    });
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

