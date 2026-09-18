import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';
import { CausalesReliquidacionFacade } from '../../../../application/facades/Liquidacion/causales-reliquidacion.facade';
import { CausalesAnulacionFacade } from '../../../../application/facades/Liquidacion/causales-anulacion.facade';
import { CausalReliquidacion } from '../../../../domain/models/Liquidacion/causal-reliquidacion.model';
import { CausalAnulacion } from '../../../../domain/models/Liquidacion/causal-anulacion.model';
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
  public facade = inject(GeneracionLiquidacionFacade);
  public causalesReliquidacionFacade = inject(CausalesReliquidacionFacade);
  public causalesAnulacionFacade = inject(CausalesAnulacionFacade);
  private router = inject(Router);
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

  // Formulario Reliquidación Dinámica
  selectedCausalReliquidacion = signal<CausalReliquidacion | null>(null);
  reliquidacionCausalId = signal<number | null>(null);
  reliquidacionMotivo = signal<string>('');
  reliquidacionDoc = signal<string>('');
  reliquidacionFechaDoc = signal<string>('');
  reliquidacionArchivo = signal<File | null>(null);
  reliquidacionArchivoNombre = signal<string>('');

  // Formulario Anulación Dinámica
  selectedCausalAnulacion = signal<CausalAnulacion | null>(null);
  anulacionCausalId = signal<number | null>(null);
  anulacionMotivo = signal<string>('');
  anulacionDocSoporte = signal<string>('');
  anulacionArchivo = signal<File | null>(null);
  anulacionArchivoNombre = signal<string>('');

  ngOnInit(): void {
    this.cargarLiquidaciones();
    this.causalesReliquidacionFacade.cargarCausalesReliquidacion(1, 100, undefined, true);
    this.causalesAnulacionFacade.cargarCausalesAnulacion(1, 100, undefined, true);
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

  // --- GESTIÓN DE RELIQUIDACIÓN ---
  abrirModalReliquidacion(liq: LiquidacionListadoDto): void {
    this.selectedLiquidacion.set(liq);
    this.reliquidacionMotivo.set('');
    this.reliquidacionDoc.set('');
    this.reliquidacionFechaDoc.set('');
    this.reliquidacionArchivo.set(null);
    this.reliquidacionArchivoNombre.set('');

    const causales = this.causalesReliquidacionFacade.causalesReliquidacion();
    if (causales.length > 0) {
      this.reliquidacionCausalId.set(causales[0].id);
      this.selectedCausalReliquidacion.set(causales[0]);
    } else {
      this.reliquidacionCausalId.set(null);
      this.selectedCausalReliquidacion.set(null);
      this.causalesReliquidacionFacade.cargarCausalesReliquidacion(1, 100, undefined, true);
    }
    this.showReliquidacionModal.set(true);
  }

  onCausalReliquidacionChange(id: number): void {
    this.reliquidacionCausalId.set(Number(id));
    const found = this.causalesReliquidacionFacade.causalesReliquidacion().find(c => c.id === Number(id));
    this.selectedCausalReliquidacion.set(found || null);
  }

  onReliquidacionFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.reliquidacionArchivo.set(file);
      this.reliquidacionArchivoNombre.set(file.name);
    } else {
      this.reliquidacionArchivo.set(null);
      this.reliquidacionArchivoNombre.set('');
    }
  }

  irAWizardReliquidacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    const causal = this.selectedCausalReliquidacion();
    if (causal?.requiereSoporte && !this.reliquidacionArchivo()) {
      this.toast.warning('Esta causal exige adjuntar el archivo de soporte digital (PDF) antes de continuar.');
      return;
    }

    if (!this.reliquidacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación para la reliquidación.');
      return;
    }

    const targetSolId = liq.radicacion?.solicitudId || liq.id;
    const queryParams: any = {
      modo: 'reliquidacion',
      liquidacionId: liq.id,
      causalId: this.reliquidacionCausalId(),
      motivo: this.reliquidacionMotivo(),
      doc: this.reliquidacionDoc(),
      fechaDoc: this.reliquidacionFechaDoc(),
      archivoNombre: this.reliquidacionArchivoNombre()
    };

    // Si ya está en trámite de reliquidación (solicitud en estado 3 PENDIENTE), navegar directamente
    if (this.estaEnTramiteReliquidacion(liq)) {
      this.showReliquidacionModal.set(false);
      this.router.navigate([`/registros/entidades/solicitudes/wizard/${targetSolId}`], { queryParams });
      return;
    }

    // Si aún no está en trámite, formalizar primero en la API para transicionar la solicitud a Estado 3 (PENDIENTE) y desbloquear la mutación
    const file = this.reliquidacionArchivo();
    const payload = {
      causalReliquidacionId: this.reliquidacionCausalId(),
      causal: causal?.codigo || 'RELIQUIDACION_GENERAL',
      motivo: this.reliquidacionMotivo().trim(),
      numeroDocumentoAclaratorio: this.reliquidacionDoc()?.trim() || null,
      fechaDocumentoAclaratorio: this.reliquidacionFechaDoc() || null,
      nombreArchivoSoporte: file?.name || null,
      tipoArchivoSoporte: file?.type || null,
      rutaArchivoSoporte: file ? `ftp://servidor_ftp/reliquidaciones/${Date.now()}_${file.name}` : null
    };

    this.facade.solicitarReliquidacion(liq.id, payload).subscribe({
      next: () => {
        this.showReliquidacionModal.set(false);
        this.toast.info('Trámite de reliquidación iniciado. Puede mutar actos y cuantías en el asistente.');
        this.router.navigate([`/registros/entidades/solicitudes/wizard/${targetSolId}`], { queryParams });
      },
      error: (err) => {
        if (err?.error?.code === 'Liquidacion.ReliquidacionEnTramite' || err?.error?.message?.includes('en curso') || err?.error?.message?.includes('en trámite')) {
          this.showReliquidacionModal.set(false);
          this.router.navigate([`/registros/entidades/solicitudes/wizard/${targetSolId}`], { queryParams });
        } else {
          this.toast.error(err?.error?.message || 'Error al iniciar trámite de reliquidación en el servidor.');
        }
      }
    });
  }

  enviarSolicitudReliquidacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    if (!this.reliquidacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación para la reliquidación.');
      return;
    }

    const causal = this.selectedCausalReliquidacion();
    const file = this.reliquidacionArchivo();

    if (causal?.requiereSoporte && !file) {
      this.toast.warning('Esta causal exige adjuntar el archivo soporte (PDF).');
      return;
    }

    const payload = {
      causalReliquidacionId: this.reliquidacionCausalId(),
      causal: causal?.codigo || 'RELIQUIDACION_GENERAL',
      motivo: this.reliquidacionMotivo().trim(),
      numeroDocumentoAclaratorio: this.reliquidacionDoc()?.trim() || null,
      fechaDocumentoAclaratorio: this.reliquidacionFechaDoc() || null,
      nombreArchivoSoporte: file?.name || null,
      tipoArchivoSoporte: file?.type || null,
      rutaArchivoSoporte: file ? `ftp://servidor_ftp/reliquidaciones/${Date.now()}_${file.name}` : null
    };

    this.facade.solicitarReliquidacion(liq.id, payload).subscribe({
      next: () => {
        this.toast.success('Solicitud de reliquidación radicada ante la Gobernación del Cauca');
        this.showReliquidacionModal.set(false);
        this.cargarLiquidaciones();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al radicar la solicitud')
    });
  }

  // --- GESTIÓN DE ANULACIÓN ---
  abrirModalAnulacion(liq: LiquidacionListadoDto): void {
    this.selectedLiquidacion.set(liq);
    this.anulacionMotivo.set('');
    this.anulacionDocSoporte.set('');
    this.anulacionArchivo.set(null);
    this.anulacionArchivoNombre.set('');

    const causales = this.causalesAnulacionFacade.causalesAnulacion();
    if (causales.length > 0) {
      this.anulacionCausalId.set(causales[0].id);
      this.selectedCausalAnulacion.set(causales[0]);
    } else {
      this.anulacionCausalId.set(null);
      this.selectedCausalAnulacion.set(null);
      this.causalesAnulacionFacade.cargarCausalesAnulacion(1, 100, undefined, true);
    }
    this.showAnulacionModal.set(true);
  }

  onCausalAnulacionChange(id: number): void {
    this.anulacionCausalId.set(Number(id));
    const found = this.causalesAnulacionFacade.causalesAnulacion().find(c => c.id === Number(id));
    this.selectedCausalAnulacion.set(found || null);
  }

  onAnulacionFileSelected(event: any): void {
    const file: File = event.target.files?.[0];
    if (file) {
      this.anulacionArchivo.set(file);
      this.anulacionArchivoNombre.set(file.name);
    } else {
      this.anulacionArchivo.set(null);
      this.anulacionArchivoNombre.set('');
    }
  }

  enviarSolicitudAnulacion(): void {
    const liq = this.selectedLiquidacion();
    if (!liq) return;

    if (!this.anulacionMotivo().trim()) {
      this.toast.warning('Por favor describa la justificación formal de la anulación');
      return;
    }

    const causal = this.selectedCausalAnulacion();
    const file = this.anulacionArchivo();

    if (causal?.requiereSoporte && !file) {
      this.toast.warning('Esta causal exige adjuntar el archivo soporte (PDF) probatorio.');
      return;
    }

    const payload = {
      causalAnulacionId: this.anulacionCausalId(),
      causal: causal?.codigo || 'ANULACION_GENERAL',
      motivo: this.anulacionMotivo().trim(),
      documentoSoporte: this.anulacionDocSoporte()?.trim() || null,
      nombreArchivoSoporte: file?.name || null,
      tipoArchivoSoporte: file?.type || null,
      rutaArchivoSoporte: file ? `ftp://servidor_ftp/anulaciones/${Date.now()}_${file.name}` : null
    };

    this.facade.solicitarAnulacion(liq.id, payload).subscribe({
      next: () => {
        this.toast.success('Solicitud de anulación radicada formalmente ante la Gobernación');
        this.showAnulacionModal.set(false);
        this.cargarLiquidaciones();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Error al radicar la anulación')
    });
  }

  estaEnTramiteReliquidacion(item: LiquidacionListadoDto): boolean {
    const obs = item.radicacion?.observacion;
    if (!obs) return false;
    const lower = obs.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lower.includes('reliquidacion en tramite') || lower.includes('reliquidacion solicitada');
  }
}
