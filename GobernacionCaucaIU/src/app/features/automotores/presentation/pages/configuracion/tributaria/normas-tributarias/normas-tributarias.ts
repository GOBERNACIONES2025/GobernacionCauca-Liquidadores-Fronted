import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NormasTributariasFacade } from '../../../../../application/facades/normas-tributarias.facade';
import {
  NormaTributariaDto,
  CreateNormaTributariaRequest,
  UpdateNormaTributariaRequest
} from '../../../../../domain/interfaces/normas-tributarias.interface';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { ParametrosSharedService } from '../../../../../../../shared/services/parametros-shared.service';

@Component({
  selector: 'app-normas-tributarias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './normas-tributarias.html'
})
export class NormasTributariasPage implements OnInit {
  public facade = inject(NormasTributariasFacade);
  private shared = inject(ParametrosSharedService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  // Formulario reactivo
  normaForm!: FormGroup;

  // Estados UI (Slide-over, modales)
  readonly isSlideOverOpen = signal<boolean>(false);
  readonly isDetailsModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<NormaTributariaDto | null>(null);
  readonly itemParaEliminar = signal<NormaTributariaDto | null>(null);
  readonly isEditMode = signal<boolean>(false);

  // Manejo de archivo adjunto PDF
  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = signal<string | null>(null);
  readonly selectedFileSize = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);

  readonly tiposNormaList = [
    { value: 'LEY', label: 'Ley', icon: 'fa-scale-balanced', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'DECRETO', label: 'Decreto', icon: 'fa-file-signature', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'RESOLUCION', label: 'Resolución', icon: 'fa-stamp', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'ORDENANZA', label: 'Ordenanza', icon: 'fa-landmark', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'ACUERDO', label: 'Acuerdo', icon: 'fa-handshake', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'CIRCULAR', label: 'Circular', icon: 'fa-paper-plane', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
  ];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.normaForm = this.fb.group({
      id: [0],
      tipoNorma: ['LEY', [Validators.required]],
      numero: ['', [Validators.required, Validators.maxLength(50)]],
      fechaExpedicion: [today],
      entidadEmisora: ['', [Validators.maxLength(200)]],
      titulo: ['', [Validators.maxLength(500)]],
      activa: [true]
    });
  }

  // Búsqueda y Filtros
  onSearch(term: string): void {
    this.facade.searchTerm.set(term);
    this.facade.pageNumber.set(1);
    this.facade.cargarNormas();
  }

  onFilterTipo(tipo: string): void {
    this.facade.tipoNormaFiltro.set(tipo);
    this.facade.pageNumber.set(1);
    this.facade.cargarNormas();
  }

  onFilterEstado(estado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.facade.estadoFiltro.set(estado);
    this.facade.pageNumber.set(1);
    this.facade.cargarNormas();
  }

  // Paginación
  onPageChange(page: number): void {
    if (page < 1 || page > this.facade.totalPages()) return;
    this.facade.pageNumber.set(page);
    this.facade.cargarNormas();
  }

  onPageSizeChange(size: number): void {
    this.facade.pageSize.set(size);
    this.facade.pageNumber.set(1);
    this.facade.cargarNormas();
  }

  // Control de Modales & SlideOver
  abrirCrear(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.limpiarArchivo();

    const today = new Date().toISOString().split('T')[0];
    this.normaForm.reset({
      id: 0,
      tipoNorma: 'LEY',
      numero: '',
      fechaExpedicion: today,
      entidadEmisora: '',
      titulo: '',
      activa: true
    });
    this.isSlideOverOpen.set(true);
  }

  abrirEditar(item: NormaTributariaDto): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.limpiarArchivo();

    this.normaForm.patchValue({
      id: item.id,
      tipoNorma: item.tipoNorma,
      numero: item.numero,
      fechaExpedicion: item.fechaExpedicion ? String(item.fechaExpedicion).split('T')[0] : '',
      entidadEmisora: item.entidadEmisora || '',
      titulo: item.titulo || '',
      activa: item.activa
    });
    this.isSlideOverOpen.set(true);
  }

  abrirDetalles(item: NormaTributariaDto): void {
    this.selectedItem.set(item);
    this.isDetailsModalOpen.set(true);
  }

  cerrarSlideOver(): void {
    this.isSlideOverOpen.set(false);
    this.selectedItem.set(null);
    this.limpiarArchivo();
  }

  cerrarDetallesModal(): void {
    this.isDetailsModalOpen.set(false);
    this.selectedItem.set(null);
  }

  // Manejo de archivos PDF
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivo(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.procesarArchivo(event.dataTransfer.files[0]);
    }
  }

  private procesarArchivo(file: File): void {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.toast.error('Solo se permiten archivos en formato PDF (.pdf).');
      return;
    }

    const maxSizeMb = 15;
    if (file.size > maxSizeMb * 1024 * 1024) {
      this.toast.error(`El archivo excede el tamaño máximo permitido (${maxSizeMb}MB).`);
      return;
    }

    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
    this.selectedFileSize.set(this.formatFileSize(file.size));
    this.toast.info(`Archivo "${file.name}" seleccionado.`);
  }

  limpiarArchivo(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set(null);
    this.selectedFileSize.set(null);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Guardar Cambios (Crear / Actualizar con FormData)
  guardarNorma(): void {
    if (this.normaForm.invalid) {
      this.normaForm.markAllAsTouched();
      this.toast.warning('Por favor complete los campos obligatorios del formulario.');
      return;
    }

    const val = this.normaForm.value;
    const file = this.selectedFile();

    if (this.isEditMode()) {
      const payload: UpdateNormaTributariaRequest = {
        id: Number(val.id),
        tipoNorma: val.tipoNorma.trim().toUpperCase(),
        numero: val.numero.trim().toUpperCase(),
        fechaExpedicion: val.fechaExpedicion || null,
        entidadEmisora: val.entidadEmisora?.trim() || null,
        titulo: val.titulo?.trim() || null,
        activa: Boolean(val.activa ?? true),
        urlFuente: this.selectedItem()?.urlFuente || null,
        hashDocumento: this.selectedItem()?.hashDocumento || null
      };

      this.facade.actualizarNorma(val.id, payload, file).subscribe(res => {
        if (res.success) {
          this.toast.success(res.message || 'Norma tributaria actualizada correctamente.');
          this.shared.refrescarNormas();
          this.cerrarSlideOver();
        } else {
          this.toast.error(res.message || 'Error al actualizar la norma tributaria.');
        }
      });
    } else {
      const payload: CreateNormaTributariaRequest = {
        tipoNorma: val.tipoNorma.trim().toUpperCase(),
        numero: val.numero.trim().toUpperCase(),
        fechaExpedicion: val.fechaExpedicion || null,
        entidadEmisora: val.entidadEmisora?.trim() || null,
        titulo: val.titulo?.trim() || null,
        activa: Boolean(val.activa ?? true)
      };

      this.facade.crearNorma(payload, file).subscribe(res => {
        if (res.success) {
          this.toast.success(res.message || 'Norma tributaria registrada correctamente.');
          this.shared.refrescarNormas();
          this.cerrarSlideOver();
        } else {
          this.toast.error(res.message || 'Error al registrar la norma tributaria.');
        }
      });
    }
  }

  // Alternar Activa (PATCH)
  toggleActiva(item: NormaTributariaDto): void {
    const nuevoEstado = !item.activa ? 'activada' : 'desactivada';
    this.facade.toggleActiva(item).subscribe(ok => {
      if (ok) {
        this.toast.success(`Norma ${item.tipoNorma} ${item.numero} ${nuevoEstado} exitosamente.`);
        this.shared.refrescarNormas();
      } else {
        this.toast.error('No se pudo modificar el estado de la norma tributaria.');
      }
    });
  }

  // Eliminación Física
  abrirConfirmarEliminar(item: NormaTributariaDto): void {
    this.itemParaEliminar.set(item);
  }

  cerrarConfirmarEliminar(): void {
    this.itemParaEliminar.set(null);
  }

  confirmarEliminacion(): void {
    const item = this.itemParaEliminar();
    if (!item) return;

    this.facade.eliminarNorma(item.id).subscribe(res => {
      if (res.success) {
        this.toast.success('Norma tributaria y documento eliminados exitosamente.');
        this.shared.refrescarNormas();
        this.cerrarConfirmarEliminar();
      } else {
        this.toast.error(res.message || 'Error al eliminar la norma tributaria.');
        this.cerrarConfirmarEliminar();
      }
    });
  }

  // Utilidades
  copiarTexto(texto: string, etiqueta: string = 'Texto'): void {
    if (!texto) return;
    navigator.clipboard.writeText(texto).then(() => {
      this.toast.success(`${etiqueta} copiado al portapapeles.`);
    }).catch(() => {
      this.toast.error('No se pudo copiar al portapapeles.');
    });
  }

  getTipoBadgeClass(tipo: string): string {
    const found = this.tiposNormaList.find(t => t.value.toUpperCase() === tipo?.toUpperCase());
    return found ? found.color : 'bg-slate-100 text-slate-700 border-slate-200';
  }

  getTipoIcon(tipo: string): string {
    const found = this.tiposNormaList.find(t => t.value.toUpperCase() === tipo?.toUpperCase());
    return found ? found.icon : 'fa-file-lines';
  }
}
