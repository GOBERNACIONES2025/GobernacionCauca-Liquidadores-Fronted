import { Component, inject, OnInit, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { VehiculosFacade } from '../../../application/facades/vehiculos.facade';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';
import { VehiculoItem } from '../../../domain/models/vehiculo.model';
import { VehiculoWizardComponent } from '../../../presentation/components/vehiculo-wizard/vehiculo-wizard';
import { AuditoriaVehiculoValidator } from '../../../application/validators/auditoria-vehiculo.validator';
import { FieldError } from '../../../application/validators/validation-result';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, VehiculoWizardComponent],
  templateUrl: './vehiculos.html'
})
export class Vehiculos implements OnInit {
  readonly facade = inject(VehiculosFacade);
  readonly liqFacade = inject(LiquidacionesFacade);
  readonly auditoriaValidator = inject(AuditoriaVehiculoValidator);
  /** fb solo se usa para editFormAuditoria — el wizard tiene su propio FormBuilder */
  private fb = inject(FormBuilder);

  // El formulario del wizard ahora vive en VehiculoWizardComponent.
  // Aquí solo mantenemos estado de la lista, modales de auditoría e inactivación.

  readonly activeMenuVehiculoId = signal<number | null>(null);
  readonly toastMessage = signal<{ title: string; desc: string; type: 'success' | 'error' | 'info' } | null>(null);

  readonly filtroModalPendientes = signal<string>('');

  readonly vehiculosPendientesFiltrados = computed(() => {
    const query = this.filtroModalPendientes().toLowerCase().trim();
    const list = this.facade.vehiculosPendientesAprobacion();
    if (!query) return list;
    return list.filter(item => 
      item.placa.toLowerCase().includes(query) ||
      item.marca.toLowerCase().includes(query) ||
      item.linea.toLowerCase().includes(query) ||
      (item.propietarioNombre && item.propietarioNombre.toLowerCase().includes(query)) ||
      (item.propietarioDocumento && item.propietarioDocumento.toLowerCase().includes(query))
    );
  });

  readonly vehiculoAuditoriaModal = signal<VehiculoItem | null>(null);
  readonly modoEdicionAuditoria = signal<boolean>(false);
  readonly buscandoPropietarioAuditoria = signal<boolean>(false);
  readonly propietarioAuditoriaEncontrado = signal<string | null>(null);
  readonly erroresAuditoria = signal<FieldError[]>([]);
  editFormAuditoria!: FormGroup;

  getAuditoriaError(campo: string): string | null {
    return this.erroresAuditoria().find(e => e.campo === campo)?.mensaje ?? null;
  }

  hasAuditoriaError(campo: string): boolean {
    return this.erroresAuditoria().some(e => e.campo === campo);
  }

  initEditFormAuditoria(item: VehiculoItem): void {
    let serv = (item.servicio || 'Particular').trim();
    if (/privad|partic/i.test(serv)) serv = 'Particular';
    else if (/públ|publ/i.test(serv)) serv = 'Público';
    else if (/ofic/i.test(serv)) serv = 'Oficial';
    else if (/espec/i.test(serv)) serv = 'Especial';

    let comb = (item.combustible || 'Gasolina').trim();
    if (/gasol/i.test(comb)) comb = 'Gasolina';
    else if (/diés|dies/i.test(comb)) comb = 'Diésel';
    else if (/eléc|elec/i.test(comb)) comb = 'Eléctrico';
    else if (/híb|hib/i.test(comb)) comb = 'Híbrido';
    else if (/gas/i.test(comb)) comb = 'Gas GNV';

    const docRaw = item.propietarioDocumento || item.propietario?.numeroDocumento || '';
    const docLimpio = docRaw.replace(/^[^0-9]+/, '').split(/[\s·]/)[0].trim() || docRaw;

    this.editFormAuditoria = this.fb.group({
      marca: [item.marca || '', Validators.required],
      linea: [item.linea || '', Validators.required],
      modelo: [item.modelo || 2024, [Validators.required, Validators.min(1900), Validators.max(2035)]],
      clase: [item.clase || item.tipoVehiculo || 'Automóvil'],
      cilindraje: [item.cilindraje || 1600, Validators.required],
      combustible: [comb],
      servicio: [serv],
      pasajeros: [item.pasajeros || 5],
      organismoTransito: [item.organismoTransito || 'Popayán - Cauca'],
      propietarioNombre: [item.propietarioNombre || item.propietario?.nombre || ''],
      propietarioDocumento: [docLimpio],
      tipoVinculoPersonaId: ['1'],
      porcentajePropiedad: [100, [Validators.required, Validators.min(1), Validators.max(100)]]
    });

    this.propietarioAuditoriaEncontrado.set(null);
  }

  buscarPropietarioAuditoria(): void {
    const numDoc = this.editFormAuditoria.get('propietarioDocumento')?.value;
    if (!numDoc || !String(numDoc).trim()) {
      this.propietarioAuditoriaEncontrado.set('⚠️ Ingrese un número de documento para realizar la búsqueda.');
      return;
    }

    const docLimpio = String(numDoc).replace(/[^0-9kK]/g, '').trim();

    this.buscandoPropietarioAuditoria.set(true);
    this.propietarioAuditoriaEncontrado.set(null);

    this.facade.buscarPropietario(1, docLimpio || String(numDoc).trim()).subscribe({
      next: (persona) => {
        this.buscandoPropietarioAuditoria.set(false);
        if (persona) {
          const nombreEncontrado = persona.razonSocial || 
            [persona.primerNombre, persona.segundoNombre, persona.primerApellido, persona.segundoApellido]
              .filter(Boolean)
              .join(' ');

          this.editFormAuditoria.patchValue({
            propietarioNombre: nombreEncontrado,
            propietarioDocumento: persona.numeroDocumento || docLimpio
          });

          this.propietarioAuditoriaEncontrado.set(`✅ Persona encontrada en BD: ${nombreEncontrado}`);
        } else {
          this.propietarioAuditoriaEncontrado.set(`ℹ️ Documento no registrado previamente (se vinculará como nuevo propietario).`);
        }
      },
      error: () => {
        this.buscandoPropietarioAuditoria.set(false);
        this.propietarioAuditoriaEncontrado.set(`ℹ️ Documento libre para registro.`);
      }
    });
  }

  abrirAuditoriaModal(item: VehiculoItem): void {
    this.facade.cargarCatalogos();
    this.initEditFormAuditoria(item);
    this.modoEdicionAuditoria.set(false);
    this.erroresAuditoria.set([]);
    this.vehiculoAuditoriaModal.set(item);
  }

  cerrarAuditoriaModal(): void {
    this.modoEdicionAuditoria.set(false);
    this.erroresAuditoria.set([]);
    this.vehiculoAuditoriaModal.set(null);
  }

  onVerDetallePendiente(item: VehiculoItem): void {
    this.abrirAuditoriaModal(item);
  }

  activarEdicionAuditoria(item: VehiculoItem): void {
    this.initEditFormAuditoria(item);
    this.erroresAuditoria.set([]);
    this.modoEdicionAuditoria.set(true);
  }

  cancelarEdicionAuditoria(): void {
    this.erroresAuditoria.set([]);
    this.modoEdicionAuditoria.set(false);
  }

  guardarEdicionAuditoria(id: number, aprobarAlGuardar: boolean = false): void {
    const result = this.auditoriaValidator.validar(this.editFormAuditoria);
    if (!result.isValid) {
      this.erroresAuditoria.set(result.errors);
      return;
    }
    this.erroresAuditoria.set([]);

    const val = this.editFormAuditoria.getRawValue();
    const updatePayload = {
      marca: String(val.marca).trim(),
      linea: String(val.linea).trim(),
      modelo: Number(val.modelo),
      clase: String(val.clase || 'Automóvil').trim(),
      tipoVehiculo: String(val.clase || 'Automóvil').trim(),
      cilindraje: Number(val.cilindraje),
      combustible: String(val.combustible || 'Gasolina').trim(),
      servicio: String(val.servicio || 'Particular').trim(),
      pasajeros: Number(val.pasajeros || 5),
      organismoTransito: String(val.organismoTransito || 'Popayán - Cauca').trim(),
      propietarioNombre: String(val.propietarioNombre || '').trim(),
      propietarioDocumento: String(val.propietarioDocumento || '').trim(),
      tipoVinculoPersonaId: Number(val.tipoVinculoPersonaId || 1),
      porcentajePropiedad: Number(val.porcentajePropiedad || 100)
    };

    this.facade.actualizarVehiculo(id, updatePayload).subscribe({
      next: () => {
        this.modoEdicionAuditoria.set(false);
        const actual = this.vehiculoAuditoriaModal();
        if (actual) {
          this.vehiculoAuditoriaModal.set({
            ...actual,
            marca: updatePayload.marca,
            linea: updatePayload.linea,
            modelo: updatePayload.modelo,
            clase: updatePayload.clase,
            tipoVehiculo: updatePayload.tipoVehiculo,
            cilindraje: updatePayload.cilindraje,
            combustible: updatePayload.combustible,
            servicio: updatePayload.servicio,
            pasajeros: updatePayload.pasajeros,
            propietarioNombre: updatePayload.propietarioNombre,
            propietarioDocumento: updatePayload.propietarioDocumento
          });
        }
        this.facade.cargarPendientesAprobacion();

        if (aprobarAlGuardar) {
          this.onCambiarEstadoAprobacion(id, 'APROBADO');
          this.cerrarAuditoriaModal();
        } else {
          this.toastMessage.set({
            title: '✨ Datos Modificados',
            desc: 'La información del vehículo fue actualizada exitosamente.',
            type: 'success'
          });
        }
      },
      error: (err) => {
        console.error('Error guardando cambios en auditoría:', err);
        this.toastMessage.set({
          title: '❌ Error al Guardar',
          desc: err.message || 'No se pudieron actualizar los datos.',
          type: 'error'
        });
      }
    });
  }

  cerrarToast(): void {
    this.toastMessage.set(null);
  }

  /** Recibe eventos de toast emitidos por VehiculoWizardComponent */
  onWizardToast(event: { title: string; desc: string; type: 'success' | 'error' | 'info' }): void {
    this.toastMessage.set(event);
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeMenuVehiculoId.update(current => current === id ? null : id);
  }

  cerrarMenu(): void {
    this.activeMenuVehiculoId.set(null);
  }

  @HostListener('document:click')
  handleDocumentClick(): void {
    this.cerrarMenu();
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.vehiculoAuditoriaModal()) {
      this.cerrarAuditoriaModal();
    } else if (this.facade.isInactivarModalOpen()) {
      this.facade.cerrarInactivar();
    } else if (this.facade.isDrawerOpen()) {
      this.facade.cerrarRegistro();
    } else if (this.facade.isRuntModalOpen()) {
      this.facade.cerrarRunt();
    } else if (this.facade.isModalPendientesOpen()) {
      this.facade.cerrarModalPendientes();
    } else if (this.facade.selectedVehiculo()) {
      this.facade.deseleccionarVehiculo();
    }
    this.cerrarMenu();
  }

  onCambiarEstadoAprobacion(id: number, nuevoEstado: string): void {
    this.facade.cambiarEstadoAprobacion(id, nuevoEstado).subscribe({
      next: () => {
        const msgMap: Record<string, string> = {
          'APROBADO': '✅ Vehículo aprobado exitosamente. Ahora aparece en la flota activa.',
          'REVISION': '🔄 Vehículo marcado para revisión de datos.',
          'RECHAZADO': '❌ Vehículo rechazado.'
        };
        this.toastMessage.set({
          title: 'Estado de Aprobación Actualizado',
          desc: msgMap[nuevoEstado.toUpperCase()] || `Estado cambiado a ${nuevoEstado}`,
          type: nuevoEstado.toUpperCase() === 'APROBADO' ? 'success' : 'info'
        });
      },
      error: (err) => {
        console.error('Error al cambiar estado de aprobación:', err);
        this.toastMessage.set({
          title: '❌ Error al actualizar estado',
          desc: err.message || 'No se pudo cambiar el estado de aprobación.',
          type: 'error'
        });
      }
    });
  }



  ngOnInit(): void {
    this.facade.refrescarDashboard();
  }

  // ─── Métodos delegados al wizard ──────────────────────────────────────────

  /**
   * Abre el drawer del wizard para nuevo registro.
   * La inicialización del formulario la hace VehiculoWizardComponent.
   */
  onAbrirRegistro(): void {
    this.facade.limpiarBusquedaPropietario();
    this.facade.abrirRegistro();
  }

  /**
   * Selecciona un vehículo y abre el wizard en modo edición.
   * El pre-poblado del formulario lo hace VehiculoWizardComponent.
   */
  onEditarVehiculo(v: VehiculoItem): void {
    this.facade.seleccionarVehiculo(v);
    this.facade.abrirExpediente(v);
    this.facade.cargarCatalogos();
  }

  /**
   * Abre el modal de detalle/expediente de un veh\u00edculo de la lista de pendientes.
   */
  onAbrirExpedienteModal(v: VehiculoItem): void {
    this.facade.seleccionarVehiculo(v);
    this.facade.abrirExpediente(v);
    this.facade.cargarCatalogos();
  }
}

