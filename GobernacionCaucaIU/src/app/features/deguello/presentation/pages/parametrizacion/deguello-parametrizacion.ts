import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { ParametrosDeguello, PlantaBeneficio } from '../../../domain/models/deguello.model';

@Component({
  selector: 'app-deguello-parametrizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deguello-parametrizacion.html',
})
export class DeguelloParametrizacionComponent implements OnInit {
  private deguelloService = inject(DeguelloService);

  readonly params = signal<ParametrosDeguello>({
    vigencia: 2026,
    valorUvt: 49799,
    factorTarifaMayorUvt: 1.0,
    tarifaCalculadaCabezas: 49800,
    porcentajeParticipacionMunicipios: 10,
    sancionMinimaUvt: 10,
    diasLimiteDeclaracionMensual: 15,
  });

  readonly plantas = signal<PlantaBeneficio[]>([]);
  readonly mensajeGuardado = signal<boolean>(false);

  // Modal para nueva PBA
  readonly isModalPbaOpen = signal<boolean>(false);
  nuevaPba: Partial<PlantaBeneficio> = {
    codigoInvima: 'INV-PBA-19',
    nombre: '',
    municipio: 'POPAYÁN',
    direccion: '',
    capacidadDiariaCabezas: 50,
    esActiva: true,
    telefono: '',
  };

  readonly municipiosCauca = [
    'POPAYÁN',
    'PATÍA - EL BORDO',
    'SANTANDER DE QUILICHAO',
    'BOLÍVAR',
    'EL TAMBO',
    'PUERTO TEJADA',
    'PIENDAMÓ',
    'TIMBÍO',
    'SILVIA',
    'CALOTO',
  ];

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.deguelloService.obtenerParametros().subscribe((p) => {
      this.params.set(p);
    });

    this.deguelloService.listarPlantasBeneficio().subscribe((pbaList) => {
      this.plantas.set(pbaList);
    });
  }

  recalcularTarifa(): void {
    const p = this.params();
    const nuevaTarifa = Math.round(p.valorUvt * p.factorTarifaMayorUvt);
    this.params.set({
      ...p,
      tarifaCalculadaCabezas: nuevaTarifa,
    });
  }

  guardarParametros(): void {
    this.deguelloService.guardarParametros(this.params()).subscribe(() => {
      this.mensajeGuardado.set(true);
      setTimeout(() => {
        this.mensajeGuardado.set(false);
      }, 4000);
    });
  }

  abrirModalPba(): void {
    this.nuevaPba = {
      codigoInvima: `INV-PBA-19${Math.floor(100 + Math.random() * 900)}`,
      nombre: '',
      municipio: 'POPAYÁN',
      direccion: '',
      capacidadDiariaCabezas: 60,
      esActiva: true,
      telefono: '(602) 8',
    };
    this.isModalPbaOpen.set(true);
  }

  cerrarModalPba(): void {
    this.isModalPbaOpen.set(false);
  }

  guardarNuevaPba(): void {
    if (!this.nuevaPba.nombre) return;

    const nueva: PlantaBeneficio = {
      id: `pba-${Date.now()}`,
      codigoInvima: this.nuevaPba.codigoInvima || 'INV-PBA-GEN',
      nombre: this.nuevaPba.nombre.toUpperCase(),
      municipio: this.nuevaPba.municipio || 'POPAYÁN',
      direccion: this.nuevaPba.direccion || 'Vía Principal',
      capacidadDiariaCabezas: Number(this.nuevaPba.capacidadDiariaCabezas) || 50,
      esActiva: this.nuevaPba.esActiva ?? true,
      telefono: this.nuevaPba.telefono || '(602) 8000000',
    };

    this.plantas.update((list) => [...list, nueva]);
    this.cerrarModalPba();
  }

  toggleEstadoPlanta(p: PlantaBeneficio): void {
    this.plantas.update((list) =>
      list.map((item) => (item.id === p.id ? { ...item, esActiva: !item.esActiva } : item))
    );
  }
}
