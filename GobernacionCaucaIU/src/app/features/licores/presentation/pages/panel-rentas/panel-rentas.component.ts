import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LicoresService } from '../../../application/licores.service';
import { LiquidacionLicores } from '../../../domain/models/licores.models';
import { formatCurrencyCop, TARIFAS_ICL_2026 } from '../../../domain/calculator/licores-tax-calculator';
import { AuditoriaModalComponent } from '../../components/auditoria-modal/auditoria-modal.component';
import { TornaguiaViewerComponent } from '../../components/tornaguia-viewer/tornaguia-viewer.component';
import { PseModalComponent } from '../../components/pse-modal/pse-modal.component';
import { AsobancarioModalComponent } from '../../components/asobancario-modal/asobancario-modal.component';
import { LegalizarModalComponent } from '../../components/legalizar-modal/legalizar-modal.component';
import { ConsultaRadicadoModalComponent } from '../../components/consulta-radicado-modal/consulta-radicado-modal.component';

@Component({
  selector: 'app-panel-rentas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuditoriaModalComponent,
    TornaguiaViewerComponent,
    PseModalComponent,
    AsobancarioModalComponent,
    LegalizarModalComponent,
    ConsultaRadicadoModalComponent,
  ],
  templateUrl: './panel-rentas.component.html',
})
export class PanelRentasComponent {
  readonly licoresService = inject(LicoresService);

  readonly tarifas = TARIFAS_ICL_2026;

  pestanaActiva = signal<'BANDEJA' | 'LEGALIZACION' | 'CATALOGO'>('BANDEJA');
  mostrarConsultaModal = signal<boolean>(false);
  liquidacionSeleccionada = signal<LiquidacionLicores | null>(null);
  modalActivo = signal<'NINGUNO' | 'AUDITORIA' | 'TORNAGUIA' | 'PSE' | 'ASOBANCARIO' | 'LEGALIZAR'>('NINGUNO');

  mensajeExito = signal<string | null>(null);

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  setFiltro(estado: string): void {
    this.licoresService.setFiltroEstado(estado);
  }

  setBusqueda(texto: string): void {
    this.licoresService.setTerminoBusqueda(texto);
  }

  setPestana(pestana: 'BANDEJA' | 'LEGALIZACION' | 'CATALOGO'): void {
    this.pestanaActiva.set(pestana);
    if (pestana === 'LEGALIZACION') {
      this.licoresService.setFiltroEstado('PAGADO_EMITIDO');
    } else if (pestana === 'BANDEJA') {
      this.licoresService.setFiltroEstado('TODOS');
    }
  }

  abrirAuditoria(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('AUDITORIA');
  }

  abrirTornaguia(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('TORNAGUIA');
  }

  abrirPse(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('PSE');
  }

  abrirAsobancario(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('ASOBANCARIO');
  }

  abrirLegalizar(liq: LiquidacionLicores): void {
    this.liquidacionSeleccionada.set(liq);
    this.modalActivo.set('LEGALIZAR');
  }

  cerrarModales(): void {
    this.modalActivo.set('NINGUNO');
    this.liquidacionSeleccionada.set(null);
  }

  // --- Handlers de Aprobación Fiscal ---

  onAprobar(evento: { id: string; observacion: string }): void {
    this.licoresService.aprobarDeclaracion(evento.id, evento.observacion);
    this.cerrarModales();
    this.lanzarMensaje('Declaración aprobada exitosamente. Se ha emitido la orden de pago oficial (PENDIENTE_PAGO).');
  }

  onRequerir(evento: { id: string; motivo: string }): void {
    this.licoresService.requerirDeclaracion(evento.id, evento.motivo);
    this.cerrarModales();
    this.lanzarMensaje('Requerimiento formal notificado al contribuyente. El estado cambió a REQUERIDO.');
  }

  onRechazar(evento: { id: string; motivo: string }): void {
    this.licoresService.rechazarDeclaracion(evento.id, evento.motivo);
    this.cerrarModales();
    this.lanzarMensaje('Declaración rechazada formalmente por el fiscalizador.');
  }

  onPagoPseExitoso(pagoData: {
    metodo: 'PSE';
    banco: string;
    referencia: string;
    codigoTransaccionPse: string;
  }): void {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const actualizada = this.licoresService.procesarPago(liq.id, pagoData);
    this.cerrarModales();

    if (actualizada) {
      this.lanzarMensaje(`Pago PSE confirmado. Tornaguía ${actualizada.tornaguiaNumero} y estampillas asignadas.`);
      this.abrirTornaguia(actualizada);
    }
  }

  onPagoAsobancario(pagoData: {
    metodo: 'ASOBANCARIO_VENTANILLA';
    banco: string;
    referencia: string;
  }): void {
    const liq = this.liquidacionSeleccionada();
    if (!liq) return;

    const actualizada = this.licoresService.procesarPago(liq.id, pagoData);
    this.cerrarModales();

    if (actualizada) {
      this.lanzarMensaje(`Pago bancario relacionado. Tornaguía ${actualizada.tornaguiaNumero} emitida.`);
      this.abrirTornaguia(actualizada);
    }
  }

  onLegalizar(evento: { id: string; funcionario: string; acta: string }): void {
    this.licoresService.legalizarTornaguia(evento.id, evento.funcionario, evento.acta);
    this.cerrarModales();
    this.lanzarMensaje(`¡Tornaguía legalizada con éxito en destino! Acta ${evento.acta} registrada.`);
  }

  restablecerSeed(): void {
    if (confirm('¿Deseas restablecer todos los datos de prueba a los valores iniciales semilla?')) {
      this.licoresService.restablecerValoresIniciales();
      this.lanzarMensaje('Base de datos restablecida a los valores iniciales.');
    }
  }

  private lanzarMensaje(msg: string): void {
    this.mensajeExito.set(msg);
    setTimeout(() => {
      this.mensajeExito.set(null);
    }, 6000);
  }
}
