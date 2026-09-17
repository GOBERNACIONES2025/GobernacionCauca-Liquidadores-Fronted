import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { LiquidacionesFacade } from '../../../../application/facades/liquidaciones.facade';
import { PagosFacade } from '../../../../application/facades/pagos.facade';
import { EstampillasStorageService } from '../../../../infrastructure/storage/storage.service';
import { DocumentoImprimibleComponent } from '../../../components/documento-imprimible/documento-imprimible.component';
import { RegistrarPagoModalComponent } from '../../../components/registrar-pago-modal/registrar-pago-modal.component';
import { EstampillasBadgeComponent } from '../../../components/ui-badge/ui-badge.component';
import { LiquidacionEstampilla, RegistroPagoRequest } from '../../../../domain/models/estampillas.models';

@Component({
  selector: 'app-liquidacion-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DocumentoImprimibleComponent,
    RegistrarPagoModalComponent,
    EstampillasBadgeComponent
  ],
  templateUrl: './liquidacion-detalle.html'
})
export class LiquidacionDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly facade = inject(LiquidacionesFacade);
  readonly pagosFacade = inject(PagosFacade);
  readonly storage = inject(EstampillasStorageService);

  readonly liquidacionId = signal<string>('');

  readonly liquidacion = computed<LiquidacionEstampilla | null>(() => {
    const id = this.liquidacionId();
    if (!id) return null;
    return this.facade.obtenerPorId(id) || null;
  });

  readonly pagosAsociados = computed(() => {
    const liq = this.liquidacion();
    if (!liq) return [];
    return this.facade.obtenerPagosDeLiquidacion(liq.id);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.liquidacionId.set(id);
    }
  }

  imprimir(): void {
    window.print();
  }

  abrirModalPago(): void {
    const liq = this.liquidacion();
    if (liq) {
      this.pagosFacade.abrirModalRegistroPago(liq);
    }
  }

  aplicarPago(req: RegistroPagoRequest): void {
    this.pagosFacade.registrarPago(req);
  }

  anularLiquidacion(): void {
    const liq = this.liquidacion();
    if (!liq) return;
    const motivo = prompt('Por favor ingrese el motivo administrativo de anulación:');
    if (motivo) {
      this.facade.anularLiquidacion(liq.id, motivo);
    }
  }
}
