import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PropietariosApiService } from '../../../infrastructure/api/propietarios-api.service';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { 
  ConsultaCiudadanaSharedComponent, 
  ConsultaSubmitPayload 
} from '../../../../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';

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
  placa?: string;
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
  imports: [CommonModule, ConsultaCiudadanaSharedComponent],
  templateUrl: './portal-ciudadano.html',
})
export class PortalCiudadano implements OnInit {
  @ViewChild(ConsultaCiudadanaSharedComponent) sharedComponent?: ConsultaCiudadanaSharedComponent;

  private propietariosApi = inject(PropietariosApiService);
  private vehiculosApi = inject(VehiculosApiService);
  private router = inject(Router);

  readonly isConsulted = signal<boolean>(false);
  readonly activeTab = signal<'inicio' | 'vehiculos' | 'liquidaciones' | 'certificados'>('inicio');

  // Modales
  readonly vehiculoSeleccionado = signal<VehiculoCiudadano | null>(null);
  readonly liquidacionParaPagar = signal<Liquidacion | null>(null);

  // Datos dinámicos del ciudadano
  readonly ciudadano = signal<CiudadanoData | null>(null);

  ngOnInit(): void {}

  alConsultar(payload: ConsultaSubmitPayload): void {
    const tipoDoc = payload.tipoDocumento;
    const cedula = payload.numeroDocumento.trim();
    const placaLimpia = payload.secondaryValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

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
          this.sharedComponent?.setLoading(false);
          this.sharedComponent?.setErrorMessage('No se encontró ningún registro con el documento y placa ingresados. Verifique los datos.');
          return;
        }

        if (prop?.id) {
          this.propietariosApi.getExpediente(prop.id).pipe(
            catchError(() => of(null))
          ).subscribe((expPropRes: any) => {
            this.sharedComponent?.setLoading(false);
            this.construirYRenderizarCiudadano(prop, veh, exp, expPropRes?.data || expPropRes, tipoDoc, cedula, placaFormateada);
          });
        } else {
          this.sharedComponent?.setLoading(false);
          this.construirYRenderizarCiudadano(prop, veh, exp, null, tipoDoc, cedula, placaFormateada);
        }
      },
      error: () => {
        this.sharedComponent?.setLoading(false);
        this.sharedComponent?.setErrorMessage('Error al conectar con la API de la Gobernación del Cauca.');
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

    const vehiculosMap = new Map<string, VehiculoCiudadano>();
    const targetVeh = veh || expVeh?.vehiculo;
    if (targetVeh) {
      const vPlaca = targetVeh.placa ? targetVeh.placa.toUpperCase() : placaFormateada;
      vehiculosMap.set(vPlaca, this.mapearVehiculoCiudadano(targetVeh, expVeh));
    }

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

  nuevaConsulta(): void {
    this.isConsulted.set(false);
    this.ciudadano.set(null);
    this.activeTab.set('inicio');
  }

  cambiarTab(tab: 'inicio' | 'vehiculos' | 'liquidaciones' | 'certificados'): void {
    this.activeTab.set(tab);
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

  totalVehiculosPendientes(): number {
    const c = this.ciudadano();
    if (!c) return 0;
    return c.vehiculos.filter(v => v.estado === 'Pendiente').length;
  }

  salir(): void {
    this.router.navigate(['/']);
  }
}
