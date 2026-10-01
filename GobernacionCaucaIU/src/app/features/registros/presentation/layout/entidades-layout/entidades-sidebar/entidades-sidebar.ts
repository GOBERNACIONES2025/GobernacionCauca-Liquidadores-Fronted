import { Component, input, output, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SolicitudesLiquidacionFacade } from '../../../../application/facades/Radicacion/solicitudes-liquidacion.facade';

@Component({
  selector: 'app-entidades-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './entidades-sidebar.html',
  styleUrl: './entidades-sidebar.css'
})
export class EntidadesSidebarComponent implements OnInit {
  readonly isCollapsed = input<boolean>(false);
  readonly toggleCollapse = output<void>();

  private facade = inject(SolicitudesLiquidacionFacade);
  devueltasCount = signal<number>(0);

  ngOnInit(): void {
    this.consultarDevueltas();
  }

  consultarDevueltas(): void {
    // Consulta rápida para notificar trámites devueltos a la notaría
    this.facade.listarSolicitudes(1, 1, undefined, 5).subscribe({
      next: (res) => {
        if (res?.data) {
          this.devueltasCount.set(res.data.totalCount || 0);
        }
      },
      error: () => {}
    });
  }
}
