import { Component, inject, signal } from '@angular/core';
import { PasaportesConfiguracionDemoService } from '../../../../application/demo/pasaportes-configuracion-demo.service';
import { ModalidadPrimerPago, ModoCalculoCupos } from '../../../../domain/models/pasaportes-configuracion-demo.model';

type SeccionConfiguracion = 'pago' | 'tipos-cita' | 'horarios' | 'bloqueos' | 'formalizadores';

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

  restaurar(): void {
    this.service.restaurarValoresDemo();
  }
}
