import { Component, inject, signal } from '@angular/core';
import { PasaportesConfiguracionDemoService } from '../../../../application/demo/pasaportes-configuracion-demo.service';
import {
  AplicacionTipoPasaporte,
  ModalidadPrimerPago,
  ModoCalculoCupos,
  TipoBeneficioLiquidacion,
  TipoCalculoValor,
} from '../../../../domain/models/pasaportes-configuracion-demo.model';

type SeccionConfiguracion = 'pago' | 'liquidacion' | 'tipos-cita' | 'horarios' | 'bloqueos' | 'formalizadores';

@Component({
  selector: 'app-pasaportes-admin-configuracion',
  standalone: true,
  templateUrl: './pasaportes-admin-configuracion.html',
})
export class PasaportesAdminConfiguracion {
  private readonly service = inject(PasaportesConfiguracionDemoService);

  readonly configuracion = this.service.configuracion;
  readonly seccion = signal<SeccionConfiguracion>('pago');

  readonly modalBloqueoAbierto = signal(false);
  readonly nuevoBloqueoFecha = signal('');
  readonly nuevoBloqueoInicio = signal('08:00');
  readonly nuevoBloqueoFin = signal('10:00');
  readonly nuevoBloqueoMotivo = signal('');
  readonly errorBloqueo = signal<string | null>(null);

  readonly confirmacionPagoAbierta = signal(false);
  readonly nuevoEstadoPagoWeb = signal<boolean | null>(null);

  readonly modalImpuestoAbierto = signal(false);
  readonly nuevoImpuestoNombre = signal('');
  readonly nuevoImpuestoTipoCalculo = signal<TipoCalculoValor>('VALOR_FIJO');
  readonly nuevoImpuestoValor = signal(0);
  readonly nuevoImpuestoAplicaA = signal<AplicacionTipoPasaporte>('AMBOS');
  readonly errorImpuesto = signal<string | null>(null);

  readonly modalBeneficioAbierto = signal(false);
  readonly nuevoBeneficioNombre = signal('');
  readonly nuevoBeneficioTipo = signal<TipoBeneficioLiquidacion>('DESCUENTO');
  readonly nuevoBeneficioTipoCalculo = signal<TipoCalculoValor>('PORCENTAJE');
  readonly nuevoBeneficioValor = signal(0);
  readonly nuevoBeneficioAplicaA = signal<AplicacionTipoPasaporte>('AMBOS');
  readonly errorBeneficio = signal<string | null>(null);

  seleccionar(seccion: SeccionConfiguracion): void {
    this.seccion.set(seccion);
  }

  solicitarCambioPagoWeb(): void {
    this.nuevoEstadoPagoWeb.set(!this.configuracion().pagoWeb.habilitado);
    this.confirmacionPagoAbierta.set(true);
  }

  cancelarCambioPagoWeb(): void {
    this.confirmacionPagoAbierta.set(false);
    this.nuevoEstadoPagoWeb.set(null);
  }

  confirmarCambioPagoWeb(): void {
    const nuevoEstado = this.nuevoEstadoPagoWeb();
    if (nuevoEstado === null) return;

    this.service.actualizarPagoWeb({ habilitado: nuevoEstado });
    this.confirmacionPagoAbierta.set(false);
    this.nuevoEstadoPagoWeb.set(null);
  }

  cambiarModalidad(event: Event): void {
    this.service.actualizarPagoWeb({ modalidad: (event.target as HTMLSelectElement).value as ModalidadPrimerPago });
  }

  cambiarValorPago(event: Event): void {
    this.service.actualizarPagoWeb({ valor: Number((event.target as HTMLInputElement).value) || 0 });
  }

  cambiarTarifaValor(id: number, event: Event): void {
    this.service.actualizarTarifa(id, { valor: Math.max(0, Number((event.target as HTMLInputElement).value) || 0) });
  }

  cambiarTarifaVigencia(id: number, event: Event): void {
    this.service.actualizarTarifa(id, { vigenciaDesde: (event.target as HTMLInputElement).value });
  }

  abrirNuevoImpuesto(): void {
    this.nuevoImpuestoNombre.set('');
    this.nuevoImpuestoTipoCalculo.set('VALOR_FIJO');
    this.nuevoImpuestoValor.set(0);
    this.nuevoImpuestoAplicaA.set('AMBOS');
    this.errorImpuesto.set(null);
    this.modalImpuestoAbierto.set(true);
  }

  cerrarNuevoImpuesto(): void {
    this.modalImpuestoAbierto.set(false);
    this.errorImpuesto.set(null);
  }

  cambiarNuevoImpuestoNombre(event: Event): void {
    this.nuevoImpuestoNombre.set((event.target as HTMLInputElement).value);
    this.errorImpuesto.set(null);
  }

  cambiarNuevoImpuestoTipoCalculo(event: Event): void {
    this.nuevoImpuestoTipoCalculo.set((event.target as HTMLSelectElement).value as TipoCalculoValor);
    this.errorImpuesto.set(null);
  }

  cambiarNuevoImpuestoValor(event: Event): void {
    this.nuevoImpuestoValor.set(Math.max(0, Number((event.target as HTMLInputElement).value) || 0));
    this.errorImpuesto.set(null);
  }

  cambiarNuevoImpuestoAplicaA(event: Event): void {
    this.nuevoImpuestoAplicaA.set((event.target as HTMLSelectElement).value as AplicacionTipoPasaporte);
    this.errorImpuesto.set(null);
  }

  guardarNuevoImpuesto(): void {
    const nombre = this.nuevoImpuestoNombre().trim();
    const valor = this.nuevoImpuestoValor();
    const tipoCalculo = this.nuevoImpuestoTipoCalculo();

    if (!nombre) {
      this.errorImpuesto.set('Ingrese el nombre del impuesto o concepto adicional.');
      return;
    }

    if (valor <= 0) {
      this.errorImpuesto.set('El valor configurado debe ser mayor que cero.');
      return;
    }

    if (tipoCalculo === 'PORCENTAJE' && valor > 100) {
      this.errorImpuesto.set('El porcentaje no puede superar el 100%.');
      return;
    }

    this.service.crearImpuesto({
      nombre,
      tipoCalculo,
      valor,
      aplicaA: this.nuevoImpuestoAplicaA(),
      activo: true,
    });

    this.modalImpuestoAbierto.set(false);
    this.errorImpuesto.set(null);
  }

  cambiarActivoImpuesto(id: number, event: Event): void {
    this.service.actualizarImpuesto(id, { activo: (event.target as HTMLInputElement).checked });
  }

  eliminarImpuesto(id: number): void {
    this.service.eliminarImpuesto(id);
  }

  abrirNuevoBeneficio(): void {
    this.nuevoBeneficioNombre.set('');
    this.nuevoBeneficioTipo.set('DESCUENTO');
    this.nuevoBeneficioTipoCalculo.set('PORCENTAJE');
    this.nuevoBeneficioValor.set(0);
    this.nuevoBeneficioAplicaA.set('AMBOS');
    this.errorBeneficio.set(null);
    this.modalBeneficioAbierto.set(true);
  }

  cerrarNuevoBeneficio(): void {
    this.modalBeneficioAbierto.set(false);
    this.errorBeneficio.set(null);
  }

  cambiarNuevoBeneficioNombre(event: Event): void {
    this.nuevoBeneficioNombre.set((event.target as HTMLInputElement).value);
    this.errorBeneficio.set(null);
  }

  cambiarNuevoBeneficioTipo(event: Event): void {
    this.nuevoBeneficioTipo.set((event.target as HTMLSelectElement).value as TipoBeneficioLiquidacion);
    this.errorBeneficio.set(null);
  }

  cambiarNuevoBeneficioTipoCalculo(event: Event): void {
    this.nuevoBeneficioTipoCalculo.set((event.target as HTMLSelectElement).value as TipoCalculoValor);
    this.errorBeneficio.set(null);
  }

  cambiarNuevoBeneficioValor(event: Event): void {
    this.nuevoBeneficioValor.set(Math.max(0, Number((event.target as HTMLInputElement).value) || 0));
    this.errorBeneficio.set(null);
  }

  cambiarNuevoBeneficioAplicaA(event: Event): void {
    this.nuevoBeneficioAplicaA.set((event.target as HTMLSelectElement).value as AplicacionTipoPasaporte);
    this.errorBeneficio.set(null);
  }

  guardarNuevoBeneficio(): void {
    const nombre = this.nuevoBeneficioNombre().trim();
    const valor = this.nuevoBeneficioValor();
    const tipoCalculo = this.nuevoBeneficioTipoCalculo();

    if (!nombre) {
      this.errorBeneficio.set('Ingrese el nombre del descuento o exención.');
      return;
    }

    if (valor <= 0) {
      this.errorBeneficio.set('El valor configurado debe ser mayor que cero.');
      return;
    }

    if (tipoCalculo === 'PORCENTAJE' && valor > 100) {
      this.errorBeneficio.set('El porcentaje no puede superar el 100%.');
      return;
    }

    this.service.crearBeneficio({
      nombre,
      tipo: this.nuevoBeneficioTipo(),
      tipoCalculo,
      valor,
      aplicaA: this.nuevoBeneficioAplicaA(),
      activo: true,
    });

    this.modalBeneficioAbierto.set(false);
    this.errorBeneficio.set(null);
  }

  cambiarActivoBeneficio(id: number, event: Event): void {
    this.service.actualizarBeneficio(id, { activo: (event.target as HTMLInputElement).checked });
  }

  eliminarBeneficio(id: number): void {
    this.service.eliminarBeneficio(id);
  }

  cambiarIntervalo(event: Event): void {
    this.service.actualizarIntervalo(Number((event.target as HTMLSelectElement).value));
  }

  cambiarModoCalculoCupos(modo: ModoCalculoCupos): void {
    this.service.actualizarModoCalculoCupos(modo);
  }

  cambiarCupoTipo(id: number, event: Event): void {
    this.service.actualizarTipoCita(id, { cupo: Number((event.target as HTMLInputElement).value) || 0 });
  }

  cambiarActivoTipo(id: number, event: Event): void {
    this.service.actualizarTipoCita(id, { activo: (event.target as HTMLInputElement).checked });
  }

  cambiarRango(id: number, campo: 'horaInicio' | 'horaFin', event: Event): void {
    this.service.actualizarRango(id, { [campo]: (event.target as HTMLInputElement).value });
  }

  cambiarActivoRango(id: number, event: Event): void {
    this.service.actualizarRango(id, { activo: (event.target as HTMLInputElement).checked });
  }

  abrirNuevoBloqueo(): void {
    this.errorBloqueo.set(null);
    this.nuevoBloqueoFecha.set('');
    this.nuevoBloqueoInicio.set('08:00');
    this.nuevoBloqueoFin.set('10:00');
    this.nuevoBloqueoMotivo.set('');
    this.modalBloqueoAbierto.set(true);
  }

  cerrarNuevoBloqueo(): void {
    this.modalBloqueoAbierto.set(false);
    this.errorBloqueo.set(null);
  }

  cambiarCampoNuevoBloqueo(campo: 'fecha' | 'inicio' | 'fin' | 'motivo', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.errorBloqueo.set(null);

    if (campo === 'fecha') this.nuevoBloqueoFecha.set(valor);
    if (campo === 'inicio') this.nuevoBloqueoInicio.set(valor);
    if (campo === 'fin') this.nuevoBloqueoFin.set(valor);
    if (campo === 'motivo') this.nuevoBloqueoMotivo.set(valor);
  }

  guardarNuevoBloqueo(): void {
    const fecha = this.nuevoBloqueoFecha();
    const horaInicio = this.nuevoBloqueoInicio();
    const horaFin = this.nuevoBloqueoFin();
    const motivo = this.nuevoBloqueoMotivo().trim();

    if (!fecha || !horaInicio || !horaFin || !motivo) {
      this.errorBloqueo.set('Complete la fecha, el rango horario y el motivo del bloqueo.');
      return;
    }

    if (horaInicio >= horaFin) {
      this.errorBloqueo.set('La hora de inicio debe ser anterior a la hora de finalización.');
      return;
    }

    const seSuperpone = this.configuracion().bloqueos.some((bloqueo) =>
      bloqueo.activo &&
      bloqueo.fecha === fecha &&
      horaInicio < bloqueo.horaFin &&
      horaFin > bloqueo.horaInicio
    );

    if (seSuperpone) {
      this.errorBloqueo.set('El rango seleccionado se superpone con otro bloqueo activo para la misma fecha.');
      return;
    }

    this.service.crearBloqueo({
      fecha,
      horaInicio,
      horaFin,
      motivo,
      activo: true,
    });

    this.modalBloqueoAbierto.set(false);
    this.errorBloqueo.set(null);
  }

  cambiarActivoBloqueo(id: number, event: Event): void {
    this.service.actualizarBloqueo(id, { activo: (event.target as HTMLInputElement).checked });
  }

  cambiarFormalizador(id: number, campo: 'disponible' | 'activo', event: Event): void {
    this.service.actualizarFormalizador(id, { [campo]: (event.target as HTMLInputElement).checked });
  }

  formalizadoresActivos(): number {
    return this.configuracion().formalizadores.filter((item) => item.activo).length;
  }

  formalizadoresDisponibles(): number {
    return this.configuracion().formalizadores.filter((item) => item.activo && item.disponible).length;
  }

  rangosActivos(): number {
    return this.configuracion().rangosHorarios.filter((item) => item.activo).length;
  }

  bloqueosActivos(): number {
    return this.configuracion().bloqueos.filter((item) => item.activo).length;
  }

  totalLiquidadoEstimado(codigo: 'ORDINARIO' | 'EJECUTIVO'): number {
    const liquidacion = this.configuracion().liquidacion;
    const tarifa = liquidacion.tarifas.find((item) => item.codigo === codigo)?.valor ?? 0;

    const impuestos = liquidacion.impuestos
      .filter((item) => item.activo && (item.aplicaA === 'AMBOS' || item.aplicaA === codigo))
      .reduce((total, item) => total + (item.tipoCalculo === 'PORCENTAJE' ? tarifa * item.valor / 100 : item.valor), 0);

    const subtotal = tarifa + impuestos;

    const beneficios = liquidacion.beneficios
      .filter((item) => item.activo && (item.aplicaA === 'AMBOS' || item.aplicaA === codigo))
      .reduce((total, item) => total + (item.tipoCalculo === 'PORCENTAJE' ? subtotal * item.valor / 100 : item.valor), 0);

    return Math.max(0, subtotal - beneficios);
  }

  primerPagoEstimado(codigo: 'ORDINARIO' | 'EJECUTIVO'): number {
    if (!this.configuracion().pagoWeb.habilitado) return 0;

    const total = this.totalLiquidadoEstimado(codigo);
    const pago = this.configuracion().pagoWeb;

    return pago.modalidad === 'PORCENTAJE'
      ? Math.round(total * pago.valor / 100)
      : Math.min(total, pago.valor);
  }

  moneda(valor: number): string {
    return valor.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    });
  }

  etiquetaAplicacion(valor: AplicacionTipoPasaporte): string {
    if (valor === 'ORDINARIO') return 'Ordinario';
    if (valor === 'EJECUTIVO') return 'Ejecutivo';
    return 'Ambos';
  }

  restaurar(): void {
    this.service.restaurarValoresDemo();
  }
}
