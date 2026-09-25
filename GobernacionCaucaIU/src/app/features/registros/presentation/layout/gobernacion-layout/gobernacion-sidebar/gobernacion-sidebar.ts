import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RegistrosPermissionsPolicy } from '../../../../domain/policies/registros-permissions.policy';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';
import { GeneracionLiquidacionFacade } from '../../../../application/facades/Liquidacion/generacion-liquidacion.facade';

@Component({
  selector: 'app-gobernacion-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gobernacion-sidebar.html',
  styleUrl: './gobernacion-sidebar.css'
})
export class GobernacionSidebarComponent implements OnInit {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();

  public permissions = inject(RegistrosPermissionsPolicy);
  private solicitudesFacade = inject(SolicitudesLiquidacionFacade);
  private liquidacionFacade = inject(GeneracionLiquidacionFacade);

  // Métricas reactivas para insignias en el menú
  pendientesRevisionCount = signal<number>(0);
  reliquidacionesPendientesCount = signal<number>(0);

  ngOnInit(): void {
    this.cargarMetricasBandeja();
  }

  cargarMetricasBandeja(): void {
    // 1. Conteo de solicitudes pendientes de revisión técnica (estado 2)
    this.solicitudesFacade.listarSolicitudes(1, 1, undefined, 2).subscribe({
      next: (res) => {
        if (res?.data) {
          this.pendientesRevisionCount.set(res.data.totalCount || 0);
        }
      },
      error: () => {}
    });

    // 2. Conteo de reliquidaciones pendientes
    this.liquidacionFacade.listarReliquidacionesPendientes(1, 1).subscribe({
      next: (res) => {
        if (res?.data) {
          this.reliquidacionesPendientesCount.set(res.data.totalCount || 0);
        }
      },
      error: () => {}
    });
  }
}
