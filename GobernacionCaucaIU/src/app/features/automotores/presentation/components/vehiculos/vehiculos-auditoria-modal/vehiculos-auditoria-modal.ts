import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VehiculosFacade } from '../../../../application/facades/vehiculos.facade';
import { VehiculoItem } from '../../../../domain/models/vehiculo.model';
import { AuditoriaVehiculoValidator } from '../../../../application/validators/vehiculos/auditoria-vehiculo.validator';
import { FieldError } from '../../../../application/validators/validation-result';

@Component({
  selector: 'app-vehiculos-auditoria-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehiculos-auditoria-modal.html'
})
export class VehiculosAuditoriaModalComponent implements OnInit {
  readonly facade = inject(VehiculosFacade);
  readonly auditoriaValidator = inject(AuditoriaVehiculoValidator);
  private fb = inject(FormBuilder);

  @Input({ required: true }) vehiculo!: VehiculoItem;
  @Output() cerrar = new EventEmitter<void>();
  @Output() cambiarEstado = new EventEmitter<{ id: number; estado: string }>();
  @Output() guardadoExitoso = new EventEmitter<{ title: string; desc: string; type: 'success' | 'error' | 'info' }>();

  readonly modoEdicion = signal<boolean>(false);
  readonly buscandoPropietario = signal<boolean>(false);
  readonly propietarioEncontrado = signal<string | null>(null);
  readonly errores = signal<FieldError[]>([]);
  editForm!: FormGroup;

  ngOnInit(): void {
    this.facade.cargarCatalogos();
    this.initEditForm(this.vehiculo);
  }

  getAuditoriaError(campo: string): string | null {
    return this.errores().find(e => e.campo === campo)?.mensaje ?? null;
  }

  hasAuditoriaError(campo: string): boolean {
    return this.errores().some(e => e.campo === campo);
  }

  initEditForm(item: VehiculoItem): void {
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

    this.editForm = this.fb.group({
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

    this.propietarioEncontrado.set(null);
  }

  buscarPropietarioAuditoria(): void {
    const numDoc = this.editForm.get('propietarioDocumento')?.value;
    if (!numDoc || !String(numDoc).trim()) {
      this.propietarioEncontrado.set('Ingrese un número de documento para realizar la búsqueda.');
      return;
    }

    const docLimpio = String(numDoc).replace(/[^0-9kK]/g, '').trim();

    this.buscandoPropietario.set(true);
    this.propietarioEncontrado.set(null);

    this.facade.buscarPropietario(1, docLimpio || String(numDoc).trim()).subscribe({
      next: (persona) => {
        this.buscandoPropietario.set(false);
        if (persona) {
          const nombreEncontrado = persona.razonSocial || 
            [persona.primerNombre, persona.segundoNombre, persona.primerApellido, persona.segundoApellido]
              .filter(Boolean)
              .join(' ');

          this.editForm.patchValue({
            propietarioNombre: nombreEncontrado,
            propietarioDocumento: persona.numeroDocumento || docLimpio
          });

          this.propietarioEncontrado.set(`Persona encontrada en BD: ${nombreEncontrado}`);
        } else {
          this.propietarioEncontrado.set(`Documento no registrado previamente (se vinculará como nuevo propietario).`);
        }
      },
      error: () => {
        this.buscandoPropietario.set(false);
        this.propietarioEncontrado.set(`Documento libre para registro.`);
      }
    });
  }

  activarEdicion(): void {
    this.initEditForm(this.vehiculo);
    this.errores.set([]);
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    this.errores.set([]);
    this.modoEdicion.set(false);
  }

  guardarEdicion(aprobarAlGuardar: boolean = false): void {
    const result = this.auditoriaValidator.validar(this.editForm);
    if (!result.isValid) {
      this.errores.set(result.errors);
      return;
    }
    this.errores.set([]);

    const val = this.editForm.getRawValue();
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

    this.facade.actualizarVehiculo(this.vehiculo.id, updatePayload).subscribe({
      next: () => {
        this.modoEdicion.set(false);
        this.vehiculo = {
          ...this.vehiculo,
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
        };
        this.facade.cargarPendientesAprobacion();

        if (aprobarAlGuardar) {
          this.cambiarEstado.emit({ id: this.vehiculo.id, estado: 'APROBADO' });
          this.cerrar.emit();
        } else {
          this.guardadoExitoso.emit({
            title: 'Datos Modificados',
            desc: 'La información del vehículo fue actualizada exitosamente.',
            type: 'success'
          });
        }
      },
      error: (err) => {
        console.error('Error guardando cambios en auditoría:', err);
        this.guardadoExitoso.emit({
          title: 'Error al Guardar',
          desc: err.message || 'No se pudieron actualizar los datos.',
          type: 'error'
        });
      }
    });
  }
}
