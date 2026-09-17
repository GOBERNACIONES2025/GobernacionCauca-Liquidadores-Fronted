import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ContribuyentesFacade, ContribuyenteDetalle360 } from '../../../../application/facades/contribuyentes.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { PagosFacade } from '../../../../application/facades/pagos.facade';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';
import { RegistrarPagoModalComponent } from '../../../components/registrar-pago-modal/registrar-pago-modal.component';
import { LiquidacionEstampilla, RegistroPagoRequest } from '../../../../domain/models/estampillas.models';

export interface EventoTimeline {
  fecha: string;
  tipo: 'CREACION' | 'CONTRATO' | 'LIQUIDACION' | 'PAGO' | 'ANULACION';
  titulo: string;
  descripcion: string;
  referencia: string;
  monto?: number;
}

@Component({
  selector: 'app-contribuyente-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, EstampillasBadgeComponent, RegistrarPagoModalComponent],
  templateUrl: './contribuyente-detalle.html'
})
export class ContribuyenteDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly facade = inject(ContribuyentesFacade);
  readonly storage = inject(EstampillasStorageService);
  readonly pagosFacade = inject(PagosFacade);

  readonly contribuyenteId = signal<string>('');
  readonly activeTab = signal<'CONTRATOS' | 'LIQUIDACIONES' | 'PAGOS' | 'TIMELINE'>('CONTRATOS');

  readonly detalle360 = computed<ContribuyenteDetalle360 | null>(() => {
    const id = this.contribuyenteId();
    if (!id) return null;
    return this.facade.obtenerDetalle360(id);
  });

  // Generación dinámica del timeline cronológico
  readonly timelineEventos = computed<EventoTimeline[]>(() => {
    const d = this.detalle360();
    if (!d) return [];

    const eventos: EventoTimeline[] = [];

    // 1. Evento Creación Contribuyente
    eventos.push({
      fecha: d.contribuyente.fechaRegistro || '2026-01-01',
      tipo: 'CREACION',
      titulo: 'Registro de Contribuyente en Plataforma',
      descripcion: `Inscripción oficial de ${d.contribuyente.nombreCompleto} (${d.contribuyente.tipoPersona} - ${d.contribuyente.tipoDocumento} ${d.contribuyente.numeroDocumento}) en el registro tributario del Cauca.`,
      referencia: d.contribuyente.numeroDocumento
    });

    // 2. Eventos de Contratos
    for (const ct of d.contratos) {
      eventos.push({
        fecha: ct.fechaSuscripcion,
        tipo: 'CONTRATO',
        titulo: `Suscripción de Contrato: ${ct.numeroContrato}`,
        descripcion: `Contrato de tipo "${ct.tipoContratoNombre}" con la entidad "${ct.entidadContratante}". Objeto: ${ct.objeto.substring(0, 100)}...`,
        referencia: ct.numeroContrato,
        monto: ct.valorContrato
      });
    }

    // 3. Eventos de Liquidaciones
    for (const liq of d.liquidaciones) {
      eventos.push({
        fecha: liq.fechaGeneracion,
        tipo: liq.estado === 'ANULADA' ? 'ANULACION' : 'LIQUIDACION',
        titulo: `Liquidación Oficial ${liq.numeroLiquidacion}`,
        descripcion: `Expedición de liquidación de estampillas departamentales por valor de ${this.storage.formatCOP(liq.totalPagar)} para el contrato ${liq.numeroContrato}. Estado: ${liq.estado}`,
        referencia: liq.numeroLiquidacion,
        monto: liq.totalPagar
      });
    }

    // 4. Eventos de Pagos
    for (const pag of d.pagos) {
      eventos.push({
        fecha: pag.fechaPago,
        tipo: 'PAGO',
        titulo: `Pago Aplicado: ${pag.numeroPago}`,
        descripcion: `Recaudo en tesorería por valor de ${this.storage.formatCOP(pag.valorPagado)} mediante ${pag.medioPagoNombre} (Ref: ${pag.numeroReferencia}) para la liquidación ${pag.numeroLiquidacion}.`,
        referencia: pag.numeroPago,
        monto: pag.valorPagado
      });
    }

    // Ordenar cronológicamente descendente
    return eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.contribuyenteId.set(id);
    }
  }

  setTab(tab: 'CONTRATOS' | 'LIQUIDACIONES' | 'PAGOS' | 'TIMELINE'): void {
    this.activeTab.set(tab);
  }

  abrirPago(liq: LiquidacionEstampilla): void {
    this.pagosFacade.abrirModalRegistroPago(liq);
  }

  aplicarPago(req: RegistroPagoRequest): void {
    this.pagosFacade.registrarPago(req);
  }
}
