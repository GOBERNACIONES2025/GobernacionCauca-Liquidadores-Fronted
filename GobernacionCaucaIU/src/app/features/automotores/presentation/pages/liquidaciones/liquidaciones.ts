import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LiquidacionesFacade } from '../../../application/facades/liquidaciones.facade';

@Component({
  selector: 'app-liquidaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones.html'
})
export class LiquidacionesPage implements OnInit {
  readonly facade = inject(LiquidacionesFacade);
  private sanitizer = inject(DomSanitizer);

  placaBuscarModal: string = '';

  ngOnInit(): void {
    this.facade.cargarLiquidaciones();
    this.facade.cargarKpis();
  }

  onBuscar(query: string): void {
    this.facade.setBuscar(query);
  }

  onSimularDirecto(): void {
    if (!this.placaBuscarModal.trim()) return;
    
    this.facade.abrirSimulacion(this.placaBuscarModal.trim());
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
