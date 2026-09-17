import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import { MotorCalculoEstampillasService, SolicitudCalculoEstampilla, ResultadoCalculoEstampillas } from '../services/motor-calculo-estampillas.service';
import { ToastService } from '../../../../core/services/toast.service';
import {
  Contribuyente,
  Contrato,
  Estampilla,
  ExencionEstampilla,
  LiquidacionEstampilla
} from '../../domain/models/estampillas.models';

export type PasoWizard = 1 | 2 | 3 | 4 | 5 | 6 | 7;

@Injectable({
  providedIn: 'root'
})
export class LiquidadorWizardFacade {
  private storage = inject(EstampillasStorageService);
  private motorCalculo = inject(MotorCalculoEstampillasService);
  private toast = inject(ToastService);
  private router = inject(Router);

  // Paso actual del Wizard (1 al 7)
  readonly pasoActual = signal<PasoWizard>(1);
  readonly maxPasoAlcanzado = signal<number>(1);
  readonly procesando = signal<boolean>(false);

  // Datos acumulados durante el flujo de liquidación
  readonly contribuyenteSeleccionado = signal<Contribuyente | null>(null);
  readonly contratoSeleccionado = signal<Contrato | null>(null);
  readonly estampillasSeleccionadas = signal<Estampilla[]>([]);
  
  // Parámetros de base gravable y deducciones
  readonly valorContratoBase = signal<number>(0);
  readonly deduccionesDescuentos = signal<number>(0);
  
  // Parámetros de exención
  readonly aplicaExencion = signal<boolean>(false);
  readonly exencionSeleccionada = signal<ExencionEstampilla | null>(null);
  readonly tipoExencionTexto = signal<string>('');
  readonly fundamentoLegalExencion = signal<string>('');
  readonly porcentajeExencion = signal<number>(0);
  readonly documentoSoporteExencion = signal<string>('');

  // Declaración jurada paso 7
  readonly declaracionJuradaAceptada = signal<boolean>(false);

  // Resultado del cálculo tributario en tiempo real
  readonly resultadoCalculo = computed<ResultadoCalculoEstampillas>(() => {
    const solicitud: SolicitudCalculoEstampilla = {
      valorContrato: this.valorContratoBase(),
      descuentosDeducciones: this.deduccionesDescuentos(),
      estampillasSeleccionadas: this.estampillasSeleccionadas(),
      aplicaExencion: this.aplicaExencion(),
      tipoExencion: this.tipoExencionTexto(),
      fundamentoExencion: this.fundamentoLegalExencion(),
      porcentajeExencion: this.porcentajeExencion(),
      documentoSoporteExencion: this.documentoSoporteExencion()
    };

    return this.motorCalculo.calcularLiquidacionCompleta(solicitud);
  });

  // Catálogos disponibles
  readonly catalogoContribuyentes = computed(() => this.storage.getContribuyentes().filter(c => c.estado === 'ACTIVO'));
  readonly catalogoContratos = computed(() => {
    const cont = this.contribuyenteSeleccionado();
    if (!cont) return this.storage.getContratos();
    return this.storage.getContratos().filter(ct => ct.contribuyenteId === cont.id);
  });
  readonly catalogoEstampillas = computed(() => this.storage.getEstampillas().filter(e => e.estado === 'ACTIVA'));
  readonly catalogoExenciones = computed(() => this.storage.getExenciones().filter(ex => ex.estado === 'ACTIVA'));

  /**
   * Inicializa o reinicia el wizard a su estado inicial.
   */
  iniciarWizard(contribuyentePreseleccionadoId?: string, contratoPreseleccionadoId?: string): void {
    this.pasoActual.set(1);
    this.maxPasoAlcanzado.set(1);
    this.procesando.set(false);
    this.declaracionJuradaAceptada.set(false);

    if (contribuyentePreseleccionadoId) {
      const c = this.storage.getContribuyenteById(contribuyentePreseleccionadoId);
      if (c) this.seleccionarContribuyente(c);
    } else {
      this.contribuyenteSeleccionado.set(null);
    }

    if (contratoPreseleccionadoId) {
      const ct = this.storage.getContratoById(contratoPreseleccionadoId);
      if (ct) this.seleccionarContrato(ct);
    } else {
      this.contratoSeleccionado.set(null);
      this.valorContratoBase.set(0);
    }

    // Por defecto, preseleccionar las principales estampillas departamentales
    const activas = this.storage.getEstampillas().filter(e => e.estado === 'ACTIVA');
    this.estampillasSeleccionadas.set(activas);

    this.deduccionesDescuentos.set(0);
    this.aplicaExencion.set(false);
    this.exencionSeleccionada.set(null);
    this.tipoExencionTexto.set('');
    this.fundamentoLegalExencion.set('');
    this.porcentajeExencion.set(0);
    this.documentoSoporteExencion.set('');
  }

  // --- MÉTODOS DE NAVEGACIÓN ENTRE PASOS ---
  irAlPaso(paso: PasoWizard): void {
    if (paso <= this.maxPasoAlcanzado() || this.validarPasoActual(this.pasoActual())) {
      this.pasoActual.set(paso);
      if (paso > this.maxPasoAlcanzado()) {
        this.maxPasoAlcanzado.set(paso);
      }
    }
  }

  avanzarPaso(): void {
    const actual = this.pasoActual();
    if (!this.validarPasoActual(actual)) return;

    if (actual < 7) {
      const siguiente = (actual + 1) as PasoWizard;
      this.pasoActual.set(siguiente);
      if (siguiente > this.maxPasoAlcanzado()) {
        this.maxPasoAlcanzado.set(siguiente);
      }
    }
  }

  retrocederPaso(): void {
    const actual = this.pasoActual();
    if (actual > 1) {
      this.pasoActual.set((actual - 1) as PasoWizard);
    }
  }

  validarPasoActual(paso: PasoWizard): boolean {
    switch (paso) {
      case 1:
        if (!this.contribuyenteSeleccionado()) {
          this.toast.warning('Por favor seleccione un contribuyente para continuar.');
          return false;
        }
        return true;
      case 2:
        if (!this.contratoSeleccionado()) {
          this.toast.warning('Por favor seleccione un contrato o acto administrativo para liquidar.');
          return false;
        }
        if (this.valorContratoBase() <= 0) {
          this.toast.warning('El valor base del contrato debe ser mayor a $ 0.');
          return false;
        }
        return true;
      case 3:
        if (this.estampillasSeleccionadas().length === 0) {
          this.toast.warning('Debe seleccionar al menos una estampilla para la liquidación.');
          return false;
        }
        return true;
      case 4:
        if (this.resultadoCalculo().baseGravableNeta <= 0) {
          this.toast.warning('La base gravable determinada debe ser mayor a $ 0.');
          return false;
        }
        return true;
      case 5:
        if (this.aplicaExencion() && this.porcentajeExencion() <= 0) {
          this.toast.warning('Si aplica exención, el porcentaje exento debe ser mayor a 0%.');
          return false;
        }
        return true;
      case 6:
        return true;
      case 7:
        if (!this.declaracionJuradaAceptada()) {
          this.toast.warning('Debe aceptar la declaración de veracidad antes de confirmar.');
          return false;
        }
        return true;
    }
  }

  // --- SELECCIONES ---
  seleccionarContribuyente(c: Contribuyente): void {
    this.contribuyenteSeleccionado.set(c);
    // Si el contrato actual no pertenece al contribuyente, deseleccionarlo
    const ctActual = this.contratoSeleccionado();
    if (ctActual && ctActual.contribuyenteId !== c.id) {
      this.contratoSeleccionado.set(null);
      this.valorContratoBase.set(0);
    }
  }

  seleccionarContrato(ct: Contrato): void {
    this.contratoSeleccionado.set(ct);
    this.valorContratoBase.set(ct.valorContrato);
    
    // Auto-seleccionar contribuyente si no estaba seleccionado
    if (!this.contribuyenteSeleccionado() || this.contribuyenteSeleccionado()?.id !== ct.contribuyenteId) {
      const c = this.storage.getContribuyenteById(ct.contribuyenteId);
      if (c) this.contribuyenteSeleccionado.set(c);
    }
  }

  toggleEstampilla(est: Estampilla): void {
    let seleccionadas = [...this.estampillasSeleccionadas()];
    const existe = seleccionadas.some(e => e.id === est.id);
    if (existe) {
      seleccionadas = seleccionadas.filter(e => e.id !== est.id);
    } else {
      seleccionadas.push(est);
    }
    this.estampillasSeleccionadas.set(seleccionadas);
  }

  seleccionarTodasEstampillas(): void {
    const activas = this.catalogoEstampillas();
    if (this.estampillasSeleccionadas().length === activas.length) {
      this.estampillasSeleccionadas.set([]);
    } else {
      this.estampillasSeleccionadas.set(activas);
    }
  }

  setValorContratoBase(valor: number): void {
    this.valorContratoBase.set(Math.max(0, valor || 0));
  }

  setDeduccionesDescuentos(valor: number): void {
    this.deduccionesDescuentos.set(Math.max(0, valor || 0));
  }

  setAplicaExencion(aplica: boolean): void {
    this.aplicaExencion.set(aplica);
    if (!aplica) {
      this.exencionSeleccionada.set(null);
      this.tipoExencionTexto.set('');
      this.fundamentoLegalExencion.set('');
      this.porcentajeExencion.set(0);
      this.documentoSoporteExencion.set('');
    }
  }

  seleccionarExencionPreset(ex: ExencionEstampilla): void {
    this.exencionSeleccionada.set(ex);
    this.tipoExencionTexto.set(ex.nombre);
    this.fundamentoLegalExencion.set(ex.fundamentoLegal);
    this.porcentajeExencion.set(ex.porcentajeAplicable);
  }

  setPorcentajeExencion(porcentaje: number): void {
    this.porcentajeExencion.set(Math.min(100, Math.max(0, porcentaje || 0)));
  }

  setDeclaracionJurada(aceptada: boolean): void {
    this.declaracionJuradaAceptada.set(aceptada);
  }

  /**
   * PASO 7: CONFIRMACIÓN Y EXPEDICIÓN DE LA LIQUIDACIÓN OFICIAL
   */
  confirmarYGenerarLiquidacion(): LiquidacionEstampilla | null {
    if (!this.validarPasoActual(7)) return null;

    const contribuyente = this.contribuyenteSeleccionado();
    const contrato = this.contratoSeleccionado();
    if (!contribuyente || !contrato) return null;

    this.procesando.set(true);

    const currentUser = this.storage.getCurrentUser();
    const solicitud: SolicitudCalculoEstampilla = {
      valorContrato: this.valorContratoBase(),
      descuentosDeducciones: this.deduccionesDescuentos(),
      estampillasSeleccionadas: this.estampillasSeleccionadas(),
      aplicaExencion: this.aplicaExencion(),
      tipoExencion: this.tipoExencionTexto(),
      fundamentoExencion: this.fundamentoLegalExencion(),
      porcentajeExencion: this.porcentajeExencion(),
      documentoSoporteExencion: this.documentoSoporteExencion()
    };

    const nuevaLiquidacion = this.motorCalculo.crearLiquidacionOficial(
      contribuyente,
      contrato,
      solicitud,
      currentUser.nombre,
      currentUser.rol
    );

    // Persistir en localStorage
    this.storage.saveLiquidacion(nuevaLiquidacion);

    // Registrar en auditoría
    this.storage.registrarAuditoria({
      usuarioNombre: currentUser.nombre,
      usuarioRol: currentUser.rol,
      accion: 'LIQUIDACION',
      entidadAfectada: 'LIQUIDACION',
      referenciaEntidad: nuevaLiquidacion.numeroLiquidacion,
      descripcion: `Emisión de liquidación oficial ${nuevaLiquidacion.numeroLiquidacion} para contrato ${contrato.numeroContrato} por ${this.storage.formatCOP(nuevaLiquidacion.totalPagar)}`
    });

    this.procesando.set(false);
    this.toast.success(`Liquidación ${nuevaLiquidacion.numeroLiquidacion} generada exitosamente.`);

    // Redirigir al detalle de la liquidación emitida
    this.router.navigate(['/estampillas/liquidaciones', nuevaLiquidacion.id]);

    return nuevaLiquidacion;
  }
}
