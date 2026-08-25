import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PropietariosApiService } from '../../../infrastructure/api/propietarios-api.service';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { CatalogoApiService } from '../../../infrastructure/api/catalogo-api.service';
import { TipoDocumentoDto } from '../../../domain/interfaces/catalogo.interface';

export interface Liquidacion {
  id: string;
  vigencia: number;
  referencia: string;
  concepto: string;
  fecha: string;
  fechaVencimiento?: string;
  valor: number;
  descuento?: number;
  estado: 'PAGADA' | 'PENDIENTE';
  comprobanteUrl?: string;
}

export interface VehiculoCiudadano {
  id?: number;
  placa: string;
  marca: string;
  linea: string;
  modelo: number;
  tipo: string;
  servicio: string;
  cilindraje: string;
  estado: 'Al día' | 'Pendiente';
  deuda?: number;
  liquidaciones: Liquidacion[];
}

export interface CertificadoCiudadano {
  id: string;
  tipo: string;
  codigo: string;
  placa: string;
  fecha: string;
}

export interface CiudadanoData {
  nombre: string;
  tipoDocumento: string;
  documento: string;
  ciudad: string;
  placaConsultada: string;
  vehiculos: VehiculoCiudadano[];
  certificados: CertificadoCiudadano[];
  actividades: {
    titulo: string;
    placa?: string;
    fecha: string;
    tipo: 'pago' | 'tramite' | 'certificado';
  }[];
}

@Component({
  selector: 'app-portal-ciudadano',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-ciudadano.html',
})
export class PortalCiudadano implements OnInit {
  private propietariosApi = inject(PropietariosApiService);
  private vehiculosApi = inject(VehiculosApiService);
  private catalogoApi = inject(CatalogoApiService);
  private router = inject(Router);

  // Selector de Rol: Ciudadano vs Administrador
  readonly tipoUsuario = signal<'CIUDADANO' | 'ADMIN'>('CIUDADANO');

  // Form signals - Ciudadano (Únicamente Documento + Placa)
  readonly tipoDocumento = signal<string>('CC');
  readonly numeroCedula = signal<string>('');
  readonly placaVehiculo = signal<string>('');

  // Form signals - Administrador
  readonly adminUsuario = signal<string>('');
  readonly adminPassword = signal<string>('');
  readonly adminMostrarPassword = signal<boolean>(false);
  readonly adminRecordar = signal<boolean>(true);

  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isConsulted = signal<boolean>(false);
  readonly activeTab = signal<'inicio' | 'vehiculos' | 'liquidaciones' | 'certificados'>('inicio');

  // Catálogo de tipos de documento
  readonly tiposDocumento = signal<TipoDocumentoDto[]>([]);

  // Filtro dentro de liquidaciones
  readonly filtroEstadoLiquidacion = signal<'TODAS' | 'PENDIENTE' | 'PAGADA'>('TODAS');

  // Modal para detalle de vehículo
  readonly vehiculoSeleccionado = signal<VehiculoCiudadano | null>(null);

  // Modal para pago
  readonly liquidacionParaPagar = signal<Liquidacion | null>(null);

  // Datos del ciudadano cargados dinámicamente desde API
  readonly ciudadano = signal<CiudadanoData | null>(null);

  ngOnInit(): void {
    this.cargarTiposDocumento();
  }

  cargarTiposDocumento(): void {
    this.catalogoApi.getTiposDocumento().pipe(
      catchError(() => of(null))
    ).subscribe((res: any) => {
      const list = res?.data || (Array.isArray(res) ? res : null);
      if (list && list.length > 0) {
        this.tiposDocumento.set(list);
      }
    });
  }

  setTipoUsuario(tipo: 'CIUDADANO' | 'ADMIN'): void {
    this.tipoUsuario.set(tipo);
    this.errorMessage.set(null);
  }

  toggleMostrarPassword(): void {
    this.adminMostrarPassword.update(v => !v);
  }

  cargarAdminDemo(): void {
    this.adminUsuario.set('sdiaz@cauca.gov.co');
    this.adminPassword.set('Cauca2026*');
    this.loginAdmin();
  }

  loginAdmin(): void {
    const user = this.adminUsuario().trim();
    const pass = this.adminPassword().trim();

    if (!user || !pass) {
      this.errorMessage.set('Por favor ingrese su usuario/correo institucional y contraseña.');
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/automotores/vehiculos']);
    }, 600);
  }

  cargarEjemplo(ejemplo: 'ejemplo1' | 'ejemplo2'): void {
    if (ejemplo === 'ejemplo1') {
      this.tipoDocumento.set('CC');
      this.numeroCedula.set('12345678');
      this.placaVehiculo.set('AAA-000');
    } else {
      this.tipoDocumento.set('CC');
      this.numeroCedula.set('11223344');
      this.placaVehiculo.set('AAA-001');
    }
    this.consultar();
  }

  consultar(): void {
    const cedula = this.numeroCedula().trim();
    const placaLimpia = this.placaVehiculo().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cedula || !placaLimpia) {
      this.errorMessage.set('Por favor ingrese su número de documento y la placa del vehículo.');
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const tipoDoc = this.tipoDocumento();
    const placaFormateada = placaLimpia.length > 3 
      ? `${placaLimpia.substring(0, 3)}-${placaLimpia.substring(3, 6)}` 
      : placaLimpia;

    forkJoin({
      propietarioRes: this.propietariosApi.getPropietarioByDocumento(tipoDoc, cedula).pipe(
        catchError(() => of(null))
      ),
      vehiculoRes: this.vehiculosApi.getVehiculoByPlaca(placaLimpia).pipe(
        catchError(() => of(null))
      ),
      expedienteVehiculoRes: this.vehiculosApi.getExpedienteByPlaca(placaLimpia).pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ propietarioRes, vehiculoRes, expedienteVehiculoRes }) => {
        const prop = propietarioRes?.data || (propietarioRes as any);
        const veh = vehiculoRes?.data || (vehiculoRes as any);
        const exp = expedienteVehiculoRes?.data || (expedienteVehiculoRes as any);

        if (!prop && !veh && !exp) {
          this.isLoading.set(false);
          this.errorMessage.set('No se encontró ningún registro con el documento y placa ingresados. Verifique los datos.');
          return;
        }

        // Si se halló el propietario en BD, podemos intentar traer su expediente completo
        if (prop?.id) {
          this.propietariosApi.getExpediente(prop.id).pipe(
            catchError(() => of(null))
          ).subscribe((expPropRes: any) => {
            this.construirYRenderizarCiudadano(prop, veh, exp, expPropRes?.data || expPropRes, tipoDoc, cedula, placaFormateada);
          });
        } else {
          this.construirYRenderizarCiudadano(prop, veh, exp, null, tipoDoc, cedula, placaFormateada);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al conectar con la API de la Gobernación del Cauca.');
        console.error('Error en consulta ciudadana:', err);
      }
    });
  }

  private construirYRenderizarCiudadano(
    prop: any, 
    veh: any, 
    expVeh: any, 
    expProp: any, 
    tipoDoc: string, 
    cedula: string, 
    placaFormateada: string
  ): void {
    this.isLoading.set(false);

    // 1. Determinar Nombre del Propietario / Ciudadano
    let nombreCiudadano = 'Ciudadano / Contribuyente';
    if (prop) {
      if (prop.razonSocial) {
        nombreCiudadano = prop.razonSocial;
      } else {
        const partes = [prop.primerNombre, prop.segundoNombre, prop.primerApellido, prop.segundoApellido].filter(Boolean);
        if (partes.length > 0) nombreCiudadano = partes.join(' ');
      }
    } else if (veh?.propietario?.nombre) {
      nombreCiudadano = veh.propietario.nombre;
    } else if (veh?.propietarioNombre) {
      nombreCiudadano = veh.propietarioNombre;
    }

    const ciudadCiudadano = prop?.ciudad || 'Popayán, Cauca';
    const docCiudadano = prop?.numeroDocumento || cedula;

    // 2. Construir lista de vehículos pertenecientes al ciudadano
    const vehiculosMap = new Map<string, VehiculoCiudadano>();

    // Agregar el vehículo consultado directamente
    const targetVeh = veh || expVeh?.vehiculo;
    if (targetVeh) {
      const vPlaca = targetVeh.placa ? targetVeh.placa.toUpperCase() : placaFormateada;
      vehiculosMap.set(vPlaca, this.mapearVehiculoCiudadano(targetVeh, expVeh));
    }

    // Agregar vehículos provenientes del expediente del propietario
    if (expProp?.vehiculos && Array.isArray(expProp.vehiculos)) {
      expProp.vehiculos.forEach((vItem: any) => {
        const vPlaca = (vItem.placa || '').toUpperCase();
        if (vPlaca && !vehiculosMap.has(vPlaca)) {
          vehiculosMap.set(vPlaca, {
            placa: vPlaca,
            marca: vItem.marca || 'Generico',
            linea: vItem.linea || 'Estándar',
            modelo: Number(vItem.modelo) || 2024,
            tipo: vItem.clase || 'Automóvil',
            servicio: 'Particular',
            cilindraje: '1600 cc',
            estado: vItem.estado === 'Activo' || vItem.estado === 'Matrícula Activa' ? 'Al día' : 'Pendiente',
            liquidaciones: []
          });
        }
      });
    }

    // Si aún no hay vehículos cargados en el Map pero teníamos la placa consultada:
    if (vehiculosMap.size === 0) {
      vehiculosMap.set(placaFormateada, {
        placa: placaFormateada,
        marca: 'Automotor',
        linea: 'Registrado',
        modelo: 2024,
        tipo: 'Automóvil',
        servicio: 'Particular',
        cilindraje: '1600 cc',
        estado: 'Al día',
        liquidaciones: []
      });
    }

    const vehiculosList = Array.from(vehiculosMap.values());

    // 3. Mapear certificados del ciudadano dinámicamente
    const fechaActualStr = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    const certificadosList: CertificadoCiudadano[] = [
      {
        id: 'cert-1',
        tipo: 'Estado de Cuenta Tributario',
        codigo: `EST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        placa: placaFormateada,
        fecha: fechaActualStr
      },
      {
        id: 'cert-2',
        tipo: 'Paz y Salvo Impuesto Vehicular',
        codigo: `PAZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        placa: placaFormateada,
        fecha: fechaActualStr
      }
    ];

    // 4. Mapear actividad reciente
    const actividadesList = [
      {
        titulo: 'Consulta de estado vehicular',
        placa: placaFormateada,
        fecha: fechaActualStr,
        tipo: 'tramite' as const
      },
      {
        titulo: 'Certificado tributario disponible',
        placa: placaFormateada,
        fecha: fechaActualStr,
        tipo: 'certificado' as const
      }
    ];

    this.ciudadano.set({
      nombre: nombreCiudadano,
      tipoDocumento: tipoDoc,
      documento: docCiudadano,
      ciudad: ciudadCiudadano,
      placaConsultada: placaFormateada,
      vehiculos: vehiculosList,
      certificados: certificadosList,
      actividades: actividadesList
    });

    this.isConsulted.set(true);
  }

  private mapearVehiculoCiudadano(v: any, expVeh: any): VehiculoCiudadano {
    const rawLiqs = expVeh?.liquidaciones || expVeh?.novedades || v?.liquidaciones || [];
    const liquidacionesMapped: Liquidacion[] = [];

    if (Array.isArray(rawLiqs) && rawLiqs.length > 0) {
      rawLiqs.forEach((l: any, index: number) => {
        liquidacionesMapped.push({
          id: l.id || `liq-${index + 1}`,
          vigencia: l.vigencia || Number(l.anio) || 2026,
          referencia: l.referencia || l.codigo || `LIQ-2026-${1000 + index}`,
          concepto: l.concepto || l.detalle || 'Impuesto sobre Vehículos Automotores',
          fecha: l.fecha || new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
          fechaVencimiento: l.fechaVencimiento || '30 de junio de 2026',
          valor: Number(l.valor) || Number(l.monto) || 250000,
          estado: l.estado === 'PAGADA' || l.estado === 'PAGADO' ? 'PAGADA' : 'PENDIENTE'
        });
      });
    }

    const tieneDeudas = liquidacionesMapped.some(l => l.estado === 'PENDIENTE');
    const totalDeuda = liquidacionesMapped
      .filter(l => l.estado === 'PENDIENTE')
      .reduce((acc, l) => acc + l.valor, 0);

    return {
      id: v.id,
      placa: v.placa || '',
      marca: v.marca || 'N/A',
      linea: v.linea || 'N/A',
      modelo: Number(v.modelo) || 2024,
      tipo: v.tipoVehiculo || v.clase || 'Automóvil',
      servicio: v.servicio || 'Particular',
      cilindraje: v.cilindraje ? `${v.cilindraje} cc` : 'N/A',
      estado: tieneDeudas ? 'Pendiente' : 'Al día',
      deuda: tieneDeudas ? totalDeuda : undefined,
      liquidaciones: liquidacionesMapped
    };
  }

  formatearPlaca(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) {
      val = val.substring(0, 3) + '-' + val.substring(3, 6);
    }
    this.placaVehiculo.set(val);
  }

  nuevaConsulta(): void {
    this.isConsulted.set(false);
    this.ciudadano.set(null);
    this.activeTab.set('inicio');
  }

  cambiarTab(tab: 'inicio' | 'vehiculos' | 'liquidaciones' | 'certificados'): void {
    this.activeTab.set(tab);
  }

  setFiltroEstadoLiquidacion(filtro: 'TODAS' | 'PENDIENTE' | 'PAGADA'): void {
    this.filtroEstadoLiquidacion.set(filtro);
  }

  verHojaDeVida(v: VehiculoCiudadano): void {
    this.vehiculoSeleccionado.set(v);
  }

  cerrarHojaDeVida(): void {
    this.vehiculoSeleccionado.set(null);
  }

  abrirPago(liq: Liquidacion): void {
    this.liquidacionParaPagar.set(liq);
  }

  cerrarPago(): void {
    this.liquidacionParaPagar.set(null);
  }

  totalDeudaGeneral(): number {
    const c = this.ciudadano();
    if (!c) return 0;
    return c.vehiculos.reduce((acc, v) => acc + (v.deuda || 0), 0);
  }

  totalVehiculosPendientes(): number {
    const c = this.ciudadano();
    if (!c) return 0;
    return c.vehiculos.filter(v => v.estado === 'Pendiente').length;
  }

  salir(): void {
    this.router.navigate(['/']);
  }
}
