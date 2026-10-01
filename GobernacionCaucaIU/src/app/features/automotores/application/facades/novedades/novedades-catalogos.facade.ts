import { Injectable, inject, signal } from '@angular/core';
import { CatalogoApiService } from '../../../infrastructure/api/catalogo-api.service';
import { CatalogoItemDto, TipoDocumentoDto } from '../../../domain/interfaces/catalogo.interface';

@Injectable({
  providedIn: 'root'
})
export class NovedadesCatalogosFacade {
  private readonly catalogoApi = inject(CatalogoApiService);

  readonly tiposDocumento = signal<TipoDocumentoDto[]>([]);
  readonly organismosTransito = signal<CatalogoItemDto[]>([]);
  readonly catalogosLoading = signal<boolean>(false);

  cargarCatalogos(): void {
    this.catalogosLoading.set(true);

    this.catalogoApi.getTiposDocumento().subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : res?.data || [];
        this.tiposDocumento.set(items);
        this.catalogosLoading.set(false);
      },
      error: () => {
        this.tiposDocumento.set([
          { id: 1, codigo: 'CC', nombre: 'Cédula de Ciudadanía' },
          { id: 2, codigo: 'NIT', nombre: 'NIT' },
          { id: 3, codigo: 'CE', nombre: 'Cédula de Extranjería' },
          { id: 4, codigo: 'TI', nombre: 'Tarjeta de Identidad' },
          { id: 5, codigo: 'PAS', nombre: 'Pasaporte' },
        ]);
        this.catalogosLoading.set(false);
      }
    });

    this.catalogoApi.getOrganismosTransito().subscribe({
      next: (res: any) => {
        const items = Array.isArray(res) ? res : res?.data || [];
        this.organismosTransito.set(items);
      },
      error: () => {
        this.organismosTransito.set([
          { id: 1, nombre: 'Secretaría de Tránsito y Transporte de Popayán' },
          { id: 2, nombre: 'Secretaría de Tránsito y Transporte de Santander de Quilichao' },
          { id: 3, nombre: 'Secretaría de Tránsito y Transporte de Puerto Tejada' },
          { id: 4, nombre: 'Secretaría de Tránsito de Cali' },
          { id: 5, nombre: 'Secretaría de Movilidad de Bogotá' },
          { id: 6, nombre: 'Secretaría de Movilidad de Medellín' },
        ]);
      }
    });
  }
}
