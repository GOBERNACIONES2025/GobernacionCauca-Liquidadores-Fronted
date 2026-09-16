import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SobretasaService } from '../../../application/sobretasa.service';
import {
  DistribuidorMayorista,
  EstacionServicioDestino,
} from '../../../domain/models/sobretasa-gasolina.models';
import {
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-sobretasa-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sobretasa-configuracion.html',
})
export class SobretasaConfiguracionComponent {
  readonly sobretasaService = inject(SobretasaService);

  tarifas = TARIFAS_SOBRETASA_2026;
  tabActiva: 'TARIFAS' | 'MAYORISTAS' | 'EDS' = 'TARIFAS';

  // Modal para agregar Mayorista
  mostrarModalMayorista = signal<boolean>(false);
  nuevoMayorista: Partial<DistribuidorMayorista> = {
    razonSocial: '',
    nombreComercial: '',
    nit: '',
    codigoSicomPlanta: '',
    municipioPlanta: 'Popayán',
    departamentoPlanta: 'Cauca',
    direccion: '',
    telefono: '',
    email: '',
    estado: 'Habilitado',
  };

  // Modal para agregar EDS
  mostrarModalEds = signal<boolean>(false);
  nuevaEds: Partial<EstacionServicioDestino> = {
    codigoSicomEds: '',
    nombreComercial: '',
    razonSocial: '',
    nit: '',
    municipio: 'Popayán',
    departamento: 'Cauca',
    direccion: '',
  };

  guardarNuevoMayorista(): void {
    if (!this.nuevoMayorista.razonSocial || !this.nuevoMayorista.nit) {
      alert('Por favor complete la Razón Social y el NIT.');
      return;
    }

    const item: DistribuidorMayorista = {
      id: `may-${Date.now()}`,
      razonSocial: this.nuevoMayorista.razonSocial.trim().toUpperCase(),
      nombreComercial: this.nuevoMayorista.nombreComercial?.trim() || this.nuevoMayorista.razonSocial.trim(),
      nit: this.nuevoMayorista.nit.trim(),
      codigoSicomPlanta: this.nuevoMayorista.codigoSicomPlanta?.trim().toUpperCase() || 'PL-000',
      municipioPlanta: this.nuevoMayorista.municipioPlanta || 'Popayán',
      departamentoPlanta: this.nuevoMayorista.departamentoPlanta || 'Cauca',
      direccion: this.nuevoMayorista.direccion || 'Jurisdicción Cauca',
      telefono: this.nuevoMayorista.telefono || '(602) 820 0000',
      email: this.nuevoMayorista.email || 'contacto@mayorista.com',
      estado: (this.nuevoMayorista.estado as any) || 'Habilitado',
    };

    this.sobretasaService.guardarMayorista(item);
    this.mostrarModalMayorista.set(false);
  }

  guardarNuevaEds(): void {
    if (!this.nuevaEds.nombreComercial || !this.nuevaEds.codigoSicomEds) {
      alert('Por favor complete el Nombre Comercial y el Código SICOM de la EDS.');
      return;
    }

    const item: EstacionServicioDestino = {
      id: `eds-${Date.now()}`,
      codigoSicomEds: this.nuevaEds.codigoSicomEds.trim(),
      nombreComercial: this.nuevaEds.nombreComercial.trim(),
      razonSocial: this.nuevaEds.razonSocial?.trim() || this.nuevaEds.nombreComercial.trim(),
      nit: this.nuevaEds.nit?.trim() || '900000000-1',
      municipio: this.nuevaEds.municipio || 'Popayán',
      departamento: this.nuevaEds.departamento || 'Cauca',
      direccion: this.nuevaEds.direccion || 'Cauca',
    };

    this.sobretasaService.guardarEds(item);
    this.mostrarModalEds.set(false);
  }

  restablecerSemilla(): void {
    if (confirm('¿Desea restablecer todos los datos de Sobretasa a los valores semilla de prueba? Se reiniciarán las declaraciones y catálogos en localStorage.')) {
      this.sobretasaService.resetearDatos();
      alert('Datos de Sobretasa restablecidos exitosamente.');
    }
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }
}
