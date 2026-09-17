import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ContratosFacade } from '../../../../application/facades/contratos.facade';
import { ContribuyentesFacade } from '../../../../application/facades/contribuyentes.facade';
import { ConfiguracionFacade } from '../../../../application/facades/configuracion.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { TipoContrato, EstadoContrato, Contribuyente } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-contrato-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './contrato-form.html'
})
export class ContratoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly facade = inject(ContratosFacade);
  readonly contribuyentesFacade = inject(ContribuyentesFacade);
  readonly configFacade = inject(ConfiguracionFacade);
  readonly storage = inject(EstampillasStorageService);

  readonly isEditing = signal<boolean>(false);
  readonly contratoId = signal<string | null>(null);

  // Búsqueda interactiva de contratista
  readonly busquedaContribuyente = signal<string>('');
  readonly contribuyenteSeleccionado = signal<Contribuyente | null>(null);
  readonly showContribuyenteDropdown = signal<boolean>(false);

  contratoForm: FormGroup = this.fb.group({
    numeroContrato: ['', [Validators.required]],
    tipoContrato: ['PRESTACION_SERVICIOS' as TipoContrato, [Validators.required]],
    fechaSuscripcion: [new Date().toISOString().substring(0, 10), [Validators.required]],
    fechaInicio: [new Date().toISOString().substring(0, 10), [Validators.required]],
    fechaTerminacion: [new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), [Validators.required]],
    entidadContratante: ['Gobernación del Cauca - Secretaría de Infraestructura', [Validators.required]],
    objeto: ['', [Validators.required, Validators.minLength(15)]],
    valorContrato: [0, [Validators.required, Validators.min(1)]],
    municipioId: ['19001', [Validators.required]],
    vigencia: [2026, [Validators.required]],
    estado: ['EN_EJECUCION' as EstadoContrato, [Validators.required]],
    observaciones: ['']
  });

  readonly tipoContratoNombres: Record<TipoContrato, string> = {
    PRESTACION_SERVICIOS: 'Contrato de Prestación de Servicios',
    OBRA_PUBLICA: 'Contrato de Obra Pública',
    SUMINISTRO: 'Contrato de Suministro',
    CONVENIO_INTERADMINISTRATIVO: 'Convenio Interadministrativo',
    ACTO_ADMINISTRATIVO: 'Acto Administrativo',
    ORDEN_COMPRA: 'Orden de Compra',
    CONSULTORIA: 'Contrato de Consultoría',
    OTRO: 'Otro Tipo de Contrato'
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const queryContribuyenteId = this.route.snapshot.queryParamMap.get('contribuyenteId');

    if (id) {
      this.isEditing.set(true);
      this.contratoId.set(id);
      const ct = this.facade.obtenerPorId(id);
      if (ct) {
        this.contratoForm.patchValue(ct);
        const c = this.storage.getContribuyenteById(ct.contribuyenteId);
        if (c) this.contribuyenteSeleccionado.set(c);
      }
    } else {
      // Auto-generar consecutivo de prueba
      const numRandom = Math.floor(1000 + Math.random() * 9000);
      this.contratoForm.patchValue({
        numeroContrato: `CT-2026-${numRandom}`
      });

      if (queryContribuyenteId) {
        const c = this.storage.getContribuyenteById(queryContribuyenteId);
        if (c) this.seleccionarContribuyente(c);
      }
    }
  }

  get contribuyentesFiltrados(): Contribuyente[] {
    const q = this.busquedaContribuyente().toLowerCase().trim();
    const todos = this.storage.getContribuyentes();
    if (!q) return todos.slice(0, 6);
    return todos.filter(c => 
      c.nombreCompleto.toLowerCase().includes(q) ||
      c.numeroDocumento.includes(q)
    ).slice(0, 8);
  }

  seleccionarContribuyente(c: Contribuyente): void {
    this.contribuyenteSeleccionado.set(c);
    this.busquedaContribuyente.set('');
    this.showContribuyenteDropdown.set(false);
  }

  onSubmit(): void {
    if (this.contratoForm.invalid || !this.contribuyenteSeleccionado()) {
      this.contratoForm.markAllAsTouched();
      return;
    }

    const val = this.contratoForm.value;
    const cont = this.contribuyenteSeleccionado()!;
    const mun = this.configFacade.municipios().find(m => m.id === val.municipioId);

    const tipoNombre = this.tipoContratoNombres[val.tipoContrato as TipoContrato] || 'Contrato';

    const saved = this.facade.guardarContrato({
      id: this.contratoId() || undefined,
      ...val,
      tipoContratoNombre: tipoNombre,
      contribuyenteId: cont.id,
      contribuyenteNombre: cont.nombreCompleto,
      contribuyenteDocumento: cont.digitoVerificacion ? `${cont.numeroDocumento}-${cont.digitoVerificacion}` : cont.numeroDocumento,
      contribuyenteTipoDoc: cont.tipoDocumento,
      municipioNombre: mun?.nombre || 'Popayán'
    });

    this.router.navigate(['/estampillas/contratos']);
  }
}
