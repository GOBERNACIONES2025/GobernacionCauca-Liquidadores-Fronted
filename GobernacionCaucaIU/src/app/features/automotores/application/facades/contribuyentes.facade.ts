import { Injectable, inject, signal } from '@angular/core';
import { PropietariosApiService } from '../../infrastructure/api/propietarios-api.service';
import { CatalogoApiService } from '../../infrastructure/api/catalogo-api.service';
import { DepartamentosApiService } from '../../infrastructure/api/departamentos-api.service';
import { 
  Contribuyente, 
  Expediente, 
  ApiResponse, 
  PagedResult, 
  Departamento, 
  Ciudad,
  TipoDocumento,
  NaturalezaJuridica
} from '../../domain/models/contribuyente.model';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ContribuyentesFacade {
  private propietariosApi = inject(PropietariosApiService);
  private catalogoApi = inject(CatalogoApiService);
  private departamentosApi = inject(DepartamentosApiService);

  // Estado centralizado
  readonly contribuyentes = signal<Contribuyente[]>([]);
  readonly totalContribuyentes = signal<number>(0);
  
  // KPIs locales
  readonly totalAlDia = signal<number>(0);
  readonly totalMorosos = signal<number>(0);
  readonly totalDeudores = signal<number>(0);

  // Estado del expediente seleccionado
  readonly selectedExpediente = signal<Expediente | null>(null);
  
  // Catálogos geográficos y maestros
  readonly departamentos = signal<Departamento[]>([]);
  readonly ciudades = signal<Ciudad[]>([]);
  readonly tiposDocumento = signal<TipoDocumento[]>([]);
  readonly naturalezasJuridicas = signal<NaturalezaJuridica[]>([]);
  
  readonly catalogosLoading = signal<boolean>(false);
  readonly ciudadesLoading = signal<boolean>(false);

  // Loading states
  readonly loading = signal<boolean>(false);
  readonly drawerLoading = signal<boolean>(false);
  
  // Error state
  readonly error = signal<string | null>(null);

  // Catálogos de respaldo iniciales / offline
  private readonly defaultTiposDocumento: TipoDocumento[] = [
    { id: 1, codigo: 'CC', nombre: 'Cédula de Ciudadanía', requiereDigitoVerificacion: false },
    { id: 2, codigo: 'NIT', nombre: 'NIT', requiereDigitoVerificacion: true },
    { id: 3, codigo: 'CE', nombre: 'Cédula de Extranjería', requiereDigitoVerificacion: false },
    { id: 4, codigo: 'PA', nombre: 'Pasaporte', requiereDigitoVerificacion: false }
  ];

  private readonly defaultNaturalezasJuridicas: NaturalezaJuridica[] = [
    { id: 1, codigo: 'PN', nombre: 'Persona Natural' },
    { id: 2, codigo: 'PJ', nombre: 'Persona Jurídica' }
  ];

  private readonly defaultDepartamentos: Departamento[] = [
    { id: 19, codigo: '19', nombre: 'Cauca' },
    { id: 76, codigo: '76', nombre: 'Valle del Cauca' },
    { id: 52, codigo: '52', nombre: 'Nariño' },
    { id: 11, codigo: '11', nombre: 'Bogotá D.C.' },
    { id: 5, codigo: '05', nombre: 'Antioquia' },
    { id: 41, codigo: '41', nombre: 'Huila' },
    { id: 68, codigo: '68', nombre: 'Santander' },
    { id: 73, codigo: '73', nombre: 'Tolima' },
    { id: 66, codigo: '66', nombre: 'Risaralda' },
    { id: 63, codigo: '63', nombre: 'Quindío' },
    { id: 17, codigo: '17', nombre: 'Caldas' },
    { id: 8, codigo: '08', nombre: 'Atlántico' }
  ];

  private readonly defaultCiudades: Ciudad[] = [
    // Cauca (19)
    { id: 19001, codigo: '19001', nombre: 'Popayán', departamentoId: 19 },
    { id: 19698, codigo: '19698', nombre: 'Santander de Quilichao', departamentoId: 19 },
    { id: 19573, codigo: '19573', nombre: 'Puerto Tejada', departamentoId: 19 },
    { id: 19532, codigo: '19532', nombre: 'Patía (El Bordo)', departamentoId: 19 },
    { id: 19548, codigo: '19548', nombre: 'Piendamó', departamentoId: 19 },
    { id: 19256, codigo: '19256', nombre: 'El Tambo', departamentoId: 19 },
    { id: 19100, codigo: '19100', nombre: 'Bolívar', departamentoId: 19 },
    { id: 19743, codigo: '19743', nombre: 'Silvia', departamentoId: 19 },
    { id: 19807, codigo: '19807', nombre: 'Timbío', departamentoId: 19 },
    { id: 19318, codigo: '19318', nombre: 'Guapi', departamentoId: 19 },
    { id: 19212, codigo: '19212', nombre: 'Corinto', departamentoId: 19 },
    { id: 19455, codigo: '19455', nombre: 'Miranda', departamentoId: 19 },
    { id: 19130, codigo: '19130', nombre: 'Caloto', departamentoId: 19 },
    { id: 19473, codigo: '19473', nombre: 'Morales', departamentoId: 19 },
    { id: 19137, codigo: '19137', nombre: 'Cajibío', departamentoId: 19 },

    // Valle del Cauca (76)
    { id: 76001, codigo: '76001', nombre: 'Cali', departamentoId: 76 },
    { id: 76520, codigo: '76520', nombre: 'Palmira', departamentoId: 76 },
    { id: 76109, codigo: '76109', nombre: 'Buenaventura', departamentoId: 76 },
    { id: 76111, codigo: '76111', nombre: 'Buga', departamentoId: 76 },
    { id: 76834, codigo: '76834', nombre: 'Tuluá', departamentoId: 76 },
    { id: 76364, codigo: '76364', nombre: 'Jamundí', departamentoId: 76 },
    { id: 76147, codigo: '76147', nombre: 'Cartago', departamentoId: 76 },
    { id: 76892, codigo: '76892', nombre: 'Yumbo', departamentoId: 76 },

    // Nariño (52)
    { id: 52001, codigo: '52001', nombre: 'Pasto', departamentoId: 52 },
    { id: 52835, codigo: '52835', nombre: 'Tumaco', departamentoId: 52 },
    { id: 52356, codigo: '52356', nombre: 'Ipiales', departamentoId: 52 },

    // Bogotá (11)
    { id: 11001, codigo: '11001', nombre: 'Bogotá D.C.', departamentoId: 11 },

    // Antioquia (5)
    { id: 5001, codigo: '05001', nombre: 'Medellín', departamentoId: 5 },
    { id: 5088, codigo: '05088', nombre: 'Bello', departamentoId: 5 },
    { id: 5266, codigo: '05266', nombre: 'Envigado', departamentoId: 5 },
    { id: 5360, codigo: '05360', nombre: 'Itagüí', departamentoId: 5 },
    { id: 5615, codigo: '05615', nombre: 'Rionegro', departamentoId: 5 },

    // Huila (41)
    { id: 41001, codigo: '41001', nombre: 'Neiva', departamentoId: 41 },
    { id: 41551, codigo: '41551', nombre: 'Pitalito', departamentoId: 41 }
  ];

  /**
   * Carga la lista de contribuyentes llamando al API y actualizando el estado
   */
  cargarContribuyentes(page: number = 1, pageSize: number = 20, buscar?: string, soloActivos: boolean = true) {
    this.loading.set(true);
    this.error.set(null);

    this.propietariosApi.getPropietarios({ page, pageSize, buscar, soloActivos }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const items = response.data.items || [];
          this.contribuyentes.set(items);
          this.totalContribuyentes.set(response.data.totalCount);

          // Cálculos locales temporales para KPIs
          const deudores = items.filter(c => c.cantidadDeudas > 0);
          this.totalDeudores.set(deudores.length);
          this.totalMorosos.set(deudores.filter(c => c.cantidadDeudas > 1).length);
          this.totalAlDia.set(items.length - deudores.length);
        } else {
          this.error.set(response.message || 'Error al cargar contribuyentes');
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión');
        this.loading.set(false);
      }
    });
  }

  /**
   * Carga todos los catálogos maestros necesarios para los formularios
   */
  cargarCatalogos() {
    this.catalogosLoading.set(true);

    forkJoin({
      departamentos: this.departamentosApi.getDepartamentos().pipe(catchError(() => of(null))),
      tiposDoc: this.catalogoApi.getTiposDocumento().pipe(catchError(() => of(null))),
      naturalezas: this.catalogoApi.getNaturalezasJuridicas().pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ departamentos, tiposDoc, naturalezas }) => {
        // Departamentos
        const deptData = (departamentos && 'data' in departamentos && departamentos.data) ? departamentos.data : (Array.isArray(departamentos) ? departamentos : null);
        this.departamentos.set(deptData && deptData.length > 0 ? deptData : this.defaultDepartamentos);

        // Tipos de Documento
        const tipData = (tiposDoc && 'data' in tiposDoc && tiposDoc.data) ? tiposDoc.data : (Array.isArray(tiposDoc) ? tiposDoc : null);
        this.tiposDocumento.set(tipData && tipData.length > 0 ? tipData : this.defaultTiposDocumento);

        // Naturalezas Jurídicas
        const natData = (naturalezas && 'data' in naturalezas && naturalezas.data) ? naturalezas.data : (Array.isArray(naturalezas) ? naturalezas : null);
        this.naturalezasJuridicas.set(natData && natData.length > 0 ? natData : this.defaultNaturalezasJuridicas);

        this.catalogosLoading.set(false);
      },
      error: () => {
        this.departamentos.set(this.defaultDepartamentos);
        this.tiposDocumento.set(this.defaultTiposDocumento);
        this.naturalezasJuridicas.set(this.defaultNaturalezasJuridicas);
        this.catalogosLoading.set(false);
      }
    });
  }

  /**
   * Carga las ciudades asociadas a un departamento
   */
  cargarCiudades(departamentoId: number) {
    if (!departamentoId) {
      this.ciudades.set([]);
      return;
    }
    this.ciudadesLoading.set(true);
    this.departamentosApi.getCiudadesByDepartamento(departamentoId).subscribe({
      next: (res) => {
        const data = (res && 'data' in res && res.data) ? res.data : (Array.isArray(res) ? res : null);
        if (data && data.length > 0) {
          this.ciudades.set(data);
        } else {
          const filtered = this.defaultCiudades.filter(c => c.departamentoId == departamentoId);
          this.ciudades.set(filtered);
        }
        this.ciudadesLoading.set(false);
      },
      error: () => {
        const filtered = this.defaultCiudades.filter(c => c.departamentoId == departamentoId);
        this.ciudades.set(filtered);
        this.ciudadesLoading.set(false);
      }
    });
  }

  /**
   * Limpia la lista de ciudades
   */
  limpiarCiudades() {
    this.ciudades.set([]);
  }

  /**
   * Carga el expediente detallado de un contribuyente
   */
  cargarExpediente(id: number) {
    this.drawerLoading.set(true);
    this.error.set(null);
    this.selectedExpediente.set(null);

    this.propietariosApi.getExpediente(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedExpediente.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar expediente');
        }
        this.drawerLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.message || 'Error de conexión al cargar expediente');
        this.drawerLoading.set(false);
      }
    });
  }

  /**
   * Limpia el expediente seleccionado
   */
  limpiarExpediente() {
    this.selectedExpediente.set(null);
  }

  /**
   * Crea un nuevo contribuyente
   */
  crearContribuyente(data: any): Observable<ApiResponse<Contribuyente>> {
    return this.propietariosApi.crearPropietario(data);
  }

  /**
   * Actualiza un contribuyente existente
   */
  actualizarContribuyente(id: number, data: any): Observable<ApiResponse<Contribuyente>> {
    return this.propietariosApi.actualizarPropietario(id, data);
  }
}
