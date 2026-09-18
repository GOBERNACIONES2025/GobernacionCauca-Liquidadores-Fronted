import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { ToastService } from '../../../../../../core/services/toast.service';
import { LiquidacionListadoDto } from '../../../../domain/models/Liquidacion/generacion-liquidacion.model';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination';
import { TableSearchComponent } from '../../../shared/components/table-search/table-search';

@Component({
  selector: 'app-entidades-liquidaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, TableSearchComponent],
  templateUrl: './entidades-liquidaciones.html',
  styleUrl: './entidades-liquidaciones.css'
})
export class EntidadesLiquidacionesComponent implements OnInit {
  private facade = inject(GeneracionLiquidacionFacade);
  private toast = inject(ToastService);

  liquidaciones = signal<LiquidacionListadoDto[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);
  searchText = signal<string>('');
  isLoading = signal<boolean>(false);

  // Modales
  showReliquidacionModal = signal<boolean>(false);
  showAnulacionModal = signal<boolean>(false);
  selectedLiquidacion = signal<LiquidacionListadoDto | null>(null);

  // Formulario Reliquidacion
  reliquidacionCausal = signal<string>('ERROR_BASE_GRAVABLE');
  reliquidacionMotivo = signal<string>('');
  reliquidacionDoc = signal<string>('');

  // Formulario Anulacion
  anulacionCausal = signal<string>('DESISTIMIENTO_PARTES');
  anulacionMotivo = signal<string>('');

  ngOnInit(): void {
    this.cargarLiquidaciones();
  }

  cargarLiquidaciones(): void {
    this.isLoading.set(true);
    this.facade.listarLiquidaciones(
      this.pageNumber(),
      this.pageSize(),
      this.searchText(),
      null
    ).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.liquidaciones.set(res.data.items || []);
          this.totalCount.set(res.data.totalCount || 0);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('Error al consultar las liquidaciones oficiales');
      }
    });
  }

  onSearch(term: string): void {
    this.searchText.set(term);
    this.pageNumber.set(1);
    this.cargarLiquidaciones();
  }

  onPageChange(page: number): void {
    this.pageNumber.set(page);
    this.cargarLiquidaciones();
  }

  descargarPdf(id: number): void {
    this.facade.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_Oficial_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.success('Recibo oficial de liquidación descargado exitosamente');
      },
      error: () => this.toast.error('Error al descargar el PDF de la liquidación')
    });
  }

  abrirModalReliquidacion(liq: LiquidacionListadoDto): void {
    this.selectedLiquidacion.set(liq);
    this.reliquidacionCausal.set('ERROR_BASE_GRAVABLE');
    this.reliquidacionMotivo.set('');
    this.reliquidacionDoc.set('');
    this.showReliquidacionModal.set(true);
  }

  enviarSolicitudReliquidacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq || !this.reliquidacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación para la reliquidación');
      return;
    }

    this.facade.solicitarReliquidacion(
      liq.id,
      this.reliquidacionCausal(),
      this.reliquidacionMotivo(),
      this.reliquidacionDoc()
    ).subscribe({
      next: () => {
        this.toast.success('Solicitud de reliquidación radicada ante la Gobernación del Cauca');
        this.showReliquidacionModal.set(false);
        this.cargarLiquidaciones();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al radicar la solicitud')
    });
  }

  abrirModalAnulacion(liq: LiquidacionListadoDto): void {
    this.selectedLiquidacion.set(liq);
    this.anulacionCausal.set('DESISTIMIENTO_PARTES');
    this.anulacionMotivo.set('');
    this.showAnulacionModal.set(true);
  }

  estaEnTramiteReliquidacion(item: LiquidacionListadoDto): boolean {
    const obs = item.radicacion?.observacion;
    if (!obs) return false;
    const lower = obs.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lower.includes('reliquidacion en tramite');
  }

  enviarSolicitudAnulacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq || !this.anulacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación de anulación');
      return;
    }

    this.facade.solicitarAnulacion(
      liq.id,
      this.anulacionCausal(),
      this.anulacionMotivo()
    ).subscribe({
      next: () => {
        this.toast.success('Solicitud de anulación radicada formalmente');
        this.showAnulacionModal.set(false);
        this.cargarLiquidaciones();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al radicar la anulación')
    });
  }
}
