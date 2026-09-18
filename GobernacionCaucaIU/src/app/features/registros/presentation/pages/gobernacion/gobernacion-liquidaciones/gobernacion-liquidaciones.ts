import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { LiquidacionListadoDto, SolicitudReliquidacionDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { ToastService } from '../../../../../../core/services/toast.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';

@Component({
  selector: 'app-gobernacion-liquidaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, TableSearchComponent],
  templateUrl: './gobernacion-liquidaciones.html',
  styleUrl: './gobernacion-liquidaciones.css'
})
export class GobernacionLiquidacionesComponent implements OnInit {
  private facade = inject(GeneracionLiquidacionFacade);
  private toast = inject(ToastService);

  // Subpestañas:
  // 1 = Solicitudes de Reliquidación Pendientes
  // 2 = Solicitudes de Anulación Pendientes
  // 3 = Directorio Oficial Departamental de Liquidaciones
  activeTab = signal<1 | 2 | 3>(1);

  // Datos
  items = signal<any[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modal Decision Reliquidacion
  selectedReliquidacion = signal<SolicitudReliquidacionDto | any | null>(null);
  showAprobarReliquidacionModal = signal<boolean>(false);
  showRechazarReliquidacionModal = signal<boolean>(false);
  motivoResolucion = signal<string>('');

  // Modal Decision Anulacion
  selectedAnulacion = signal<any | null>(null);
  showAprobarAnulacionModal = signal<boolean>(false);
  showRechazarAnulacionModal = signal<boolean>(false);

  // Modal Anulacion de Oficio
  showAnulacionOficioModal = signal<boolean>(false);
  selectedLiquidacionOficio = signal<LiquidacionListadoDto | null>(null);
  motivoOficio = signal<string>('');

  ngOnInit(): void {
    this.cargarDatos();
  }

  cambiarPestana(tab: 1 | 2 | 3): void {
    this.activeTab.set(tab);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.isLoading.set(true);
    const tab = this.activeTab();

    if (tab === 1) {
      this.facade.listarReliquidacionesPendientes(
        this.pageNumber(),
        this.pageSize(),
        this.searchText()
      ).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.items.set(res.data.items || []);
            this.totalCount.set(res.data.totalCount || 0);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('Error al consultar reliquidaciones pendientes');
        }
      });
    } else if (tab === 2) {
      this.facade.listarAnulacionesPendientes(
        this.pageNumber(),
        this.pageSize(),
        this.searchText()
      ).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.items.set(res.data.items || []);
            this.totalCount.set(res.data.totalCount || 0);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('Error al consultar anulaciones pendientes');
        }
      });
    } else {
      this.facade.listarLiquidaciones(
        this.pageNumber(),
        this.pageSize(),
        this.searchText()
      ).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.data) {
            this.items.set(res.data.items || []);
            this.totalCount.set(res.data.totalCount || 0);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.toast.error('Error al consultar directorio departamental');
        }
      });
    }
  }

  onSearch(term: string): void {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarDatos();
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarDatos();
  }

  descargarPdf(id: number): void {
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_Cauca_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Archivo fiscal descargado');
      },
      error: () => this.toast.error('Error al descargar PDF')
    });
  }

  // --- Helpers de Formato Visual para Reliquidaciones ---
  getCausalLabel(causal: string | null | undefined): string {
    if (!causal) return 'Revisión General';
    switch (causal.toUpperCase()) {
      case 'ERROR_BASE_GRAVABLE': return 'Error en Base Gravable';
      case 'ERROR_SUJETO_PASIVO': return 'Error en Sujeto Pasivo';
      case 'ERROR_TARIFA': return 'Error en Tarifa Aplicada';
      case 'DOCUMENTO_ACLARATORIO': return 'Documento Aclaratorio';
      case 'CAMBIO_ACTO_CUANTIA': return 'Modificación de Acto / Cuantía';
      case 'CAMBIO_ACTOS': return 'Modificación de Actos';
      case 'EXENCION_NO_APLICADA': return 'Exención No Aplicada';
      default: return causal.replace(/_/g, ' ');
    }
  }

  getCausalBadgeClass(causal: string | null | undefined): string {
    if (!causal) return 'bg-slate-100 text-slate-700 border-slate-200';
    switch (causal.toUpperCase()) {
      case 'ERROR_BASE_GRAVABLE': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ERROR_SUJETO_PASIVO': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'ERROR_TARIFA': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'DOCUMENTO_ACLARATORIO': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'EXENCION_NO_APLICADA': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CAMBIO_ACTO_CUANTIA': return 'bg-orange-50 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  // --- RELIQUIDACION ---
  abrirAprobarReliquidacion(item: any): void {
    this.selectedReliquidacion.set(item);
    this.motivoResolucion.set('Aprobada conforme a revisión de documentos aportados.');
    this.showAprobarReliquidacionModal.set(true);
  }

  confirmarAprobarReliquidacion(): void {
    const it = this.selectedReliquidacion();
    if (!it) return;
    const targetId = it.liquidacionId || it.id;
    this.facade.aprobarReliquidacion(targetId, this.motivoResolucion()).subscribe({
      next: (res) => {
        this.toast.success(`Reliquidación aprobada. Nuevo título expedido: #${res.data}`);
        this.showAprobarReliquidacionModal.set(false);
        this.cargarDatos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al aprobar reliquidación')
    });
  }

  abrirRechazarReliquidacion(item: any): void {
    this.selectedReliquidacion.set(item);
    this.motivoResolucion.set('');
    this.showRechazarReliquidacionModal.set(true);
  }

  confirmarRechazarReliquidacion(): void {
    const it = this.selectedReliquidacion();
    if (!it || !this.motivoResolucion().trim()) {
      this.toast.warning('Debe motivar la causal de rechazo');
      return;
    }
    const targetId = it.liquidacionId || it.id;
    this.facade.rechazarReliquidacion(targetId, this.motivoResolucion()).subscribe({
      next: () => {
        this.toast.success('Reliquidación rechazada formalmente. Título original vigente.');
        this.showRechazarReliquidacionModal.set(false);
        this.cargarDatos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al rechazar')
    });
  }

  // --- ANULACION ---
  abrirAprobarAnulacion(item: any): void {
    this.selectedAnulacion.set(item);
    this.motivoResolucion.set('Anulación autorizada por fiscalización de rentas.');
    this.showAprobarAnulacionModal.set(true);
  }

  confirmarAprobarAnulacion(): void {
    const it = this.selectedAnulacion();
    if (!it) return;
    const targetId = it.liquidacionId || it.id;
    this.facade.aprobarAnulacion(targetId, this.motivoResolucion()).subscribe({
      next: () => {
        this.toast.success('Liquidación anulada formalmente');
        this.showAprobarAnulacionModal.set(false);
        this.cargarDatos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al anular')
    });
  }

  abrirRechazarAnulacion(item: any): void {
    this.selectedAnulacion.set(item);
    this.motivoResolucion.set('');
    this.showRechazarAnulacionModal.set(true);
  }

  confirmarRechazarAnulacion(): void {
    const it = this.selectedAnulacion();
    if (!it || !this.motivoResolucion().trim()) {
      this.toast.warning('Debe motivar el rechazo');
      return;
    }
    const targetId = it.liquidacionId || it.id;
    this.facade.rechazarAnulacion(targetId, this.motivoResolucion()).subscribe({
      next: () => {
        this.toast.success('Solicitud de anulación rechazada');
        this.showRechazarAnulacionModal.set(false);
        this.cargarDatos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al rechazar')
    });
  }

  // --- ANULACION DE OFICIO ---
  abrirAnulacionOficio(item: LiquidacionListadoDto): void {
    this.selectedLiquidacionOficio.set(item);
    this.motivoOficio.set('');
    this.showAnulacionOficioModal.set(true);
  }

  confirmarAnulacionOficio(): void {
    const liq = this.selectedLiquidacionOficio();
    if (!liq || !this.motivoOficio().trim()) {
      this.toast.warning('Debe indicar la causal fiscal de la anulación de oficio');
      return;
    }
    this.facade.anularLiquidacion(liq.id, this.motivoOficio()).subscribe({
      next: () => {
        this.toast.success('Liquidación anulada de oficio administrativamente');
        this.showAnulacionOficioModal.set(false);
        this.cargarDatos();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al anular de oficio')
    });
  }
}
