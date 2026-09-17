import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LiquidadorWizardFacade, PasoWizard } from '../../../application/facades/liquidador-wizard.facade';
import { EstampillasStorageService } from '../../../infrastructure/storage/storage.service';
import { Contribuyente, Contrato, Estampilla, ExencionEstampilla } from '../../../domain/models/estampillas.models';

@Component({
  selector: 'app-liquidar-wizard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './liquidar-wizard.html',
  styleUrls: ['./liquidar-wizard.css']
})
export class LiquidarWizardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly wizard = inject(LiquidadorWizardFacade);
  readonly storage = inject(EstampillasStorageService);

  // Filtro de búsqueda en Paso 1 (Contribuyentes)
  busquedaContribuyenteTexto = signal<string>('');
  
  // Filtro de búsqueda en Paso 2 (Contratos)
  busquedaContratoTexto = signal<string>('');

  ngOnInit(): void {
    const queryContribuyenteId = this.route.snapshot.queryParamMap.get('contribuyenteId') || undefined;
    const queryContratoId = this.route.snapshot.queryParamMap.get('contratoId') || undefined;

    this.wizard.iniciarWizard(queryContribuyenteId, queryContratoId);
  }

  // --- PASO 1: CONTRIBUYENTES ---
  get contribuyentesFiltrados(): Contribuyente[] {
    const q = this.busquedaContribuyenteTexto().toLowerCase().trim();
    const list = this.wizard.catalogoContribuyentes();
    if (!q) return list;
    return list.filter(c => 
      c.nombreCompleto.toLowerCase().includes(q) ||
      c.numeroDocumento.includes(q) ||
      (c.razonSocial && c.razonSocial.toLowerCase().includes(q))
    );
  }

  // --- PASO 2: CONTRATOS ---
  get contratosFiltrados(): Contrato[] {
    const q = this.busquedaContratoTexto().toLowerCase().trim();
    const list = this.wizard.catalogoContratos();
    if (!q) return list;
    return list.filter(ct => 
      ct.numeroContrato.toLowerCase().includes(q) ||
      ct.objeto.toLowerCase().includes(q) ||
      ct.entidadContratante.toLowerCase().includes(q)
    );
  }

  // --- MÉTODOS DE ACCIÓN ---
  seleccionarContribuyenteYPaso(c: Contribuyente): void {
    this.wizard.seleccionarContribuyente(c);
  }

  seleccionarContratoYPaso(ct: Contrato): void {
    this.wizard.seleccionarContrato(ct);
  }

  irAPaso(paso: PasoWizard): void {
    this.wizard.irAlPaso(paso);
  }

  avanzar(): void {
    this.wizard.avanzarPaso();
  }

  retroceder(): void {
    this.wizard.retrocederPaso();
  }

  confirmarLiquidacion(): void {
    this.wizard.confirmarYGenerarLiquidacion();
  }
}
