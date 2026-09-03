import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { VehiculosApiService } from '../../../infrastructure/api/vehiculos-api.service';
import { 
  ConsultaCiudadanaSharedComponent, 
  ConsultaSubmitPayload,
  TIPOS_DOCUMENTO_OPCIONES
} from '../../../../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';
import { 
  ConsultaVehicularData, 
  ConsultaVehicularRequest
} from '../../../domain/interfaces/consulta-vehicular.interface';

export interface LiquidacionCiudadano {
  id: string;
  vigencia: number;
  placa: string;
  detalle: string;
  valor: number;
  estado: string;
  esPagada: boolean;
}

export interface HistorialCiudadano {
  fecha: string;
  accion: string;
  usuario?: string;
}

export interface NovedadCiudadano {
  tipo?: string;
  detalle?: string;
  fecha?: string;
}

export interface CertificadoCiudadano {
  id: string;
  tipo: string;
  vigencia: number;
  placa: string;
  fecha: string;
  codigo: string;
}

export interface PropietarioCiudadano {
  nombre: string;
  tipoDocumentoId: number;
  tipoDocumentoNombre: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  activo: boolean;
}

export interface VehiculoCiudadano {
  id: number;
  placa: string;
  marca: string;
  linea: string;
  modelo: number;
  cilindraje: number;
  tipoVehiculo: string | null;
  clase: string | null;
  servicio: string | null;
  combustible: string | null;
  pasajeros: number | null;
  fechaMatricula: string | null;
  estadoMatriculaNombre: string | null;
  organismoTransitoNombre: string | null;
  estadoGeneral: 'Al día' | 'Pendiente';
  deudaTotal: number;
  liquidaciones: LiquidacionCiudadano[];
  historial: HistorialCiudadano[];
  novedades: NovedadCiudadano[];
}

export interface RelacionCiudadano {
  tipoVinculo: string;
  porcentaje: number;
  esResponsable: boolean;
  fechaInicio: string | null;
}

export interface CiudadanoData {
  propietario: PropietarioCiudadano;
  relacion: RelacionCiudadano;
  vehiculo: VehiculoCiudadano;
  certificados: CertificadoCiudadano[];
}

@Component({
  selector: 'app-portal-ciudadano',
  standalone: true,
  imports: [CommonModule, ConsultaCiudadanaSharedComponent],
  templateUrl: './portal-ciudadano.html',
})
export class PortalCiudadano implements OnInit {
  @ViewChild(ConsultaCiudadanaSharedComponent) sharedComponent?: ConsultaCiudadanaSharedComponent;

  private vehiculosApi = inject(VehiculosApiService);
  private router = inject(Router);

  readonly isConsulted = signal<boolean>(false);
  readonly activeTab = signal<'inicio' | 'historial' | 'liquidaciones' | 'certificados'>('inicio');

  // Modales
  readonly liquidacionParaPagar = signal<LiquidacionCiudadano | null>(null);

  // Datos dinámicos del ciudadano provenientes exclusivamente de la API
  readonly ciudadano = signal<CiudadanoData | null>(null);

  ngOnInit(): void {}

  alConsultar(payload: ConsultaSubmitPayload): void {
    const tipoDocId = Number(payload.tipoDocumento) || 1;
    const docNum = payload.numeroDocumento.trim();
    const placaLimpia = payload.secondaryValue.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const request: ConsultaVehicularRequest = {
      tipoDocumento: tipoDocId,
      numeroDocumento: docNum,
      placa: placaLimpia
    };

    this.vehiculosApi.consultarVehicular(request).subscribe({
      next: (res) => {
        this.sharedComponent?.setLoading(false);
        if (!res || !res.success || !res.data) {
          this.sharedComponent?.setErrorMessage(res?.message || 'No se encontró información del vehículo o propietario con los datos ingresados.');
          return;
        }

        this.procesarRespuestaApi(res.data, tipoDocId);
      },
      error: (err) => {
        this.sharedComponent?.setLoading(false);
        const errMsg = err?.error?.message || err?.message || 'No se encontró ningún registro con el documento y placa ingresados. Verifique los datos.';
        this.sharedComponent?.setErrorMessage(errMsg);
      }
    });
  }

  /**
   * Limpia prefijos institucionales repetitivos como "SECRETARÍA DE MOVILIDAD DE",
   * "INSPECCIÓN DE TRÁNSITO Y TRANSPORTE DE", etc., para conservar únicamente el municipio.
   */
  private limpiarNombreOrganismoTransito(nombre?: string | null): string {
    if (!nombre) return '';
    let limpio = nombre.trim();

    const regex = /^(SECRETAR[IÍ]A\s+DE\s+MOVILIDAD(\s+(DE|DEL))?|INSPECCI[OÓ]N\s+DE\s+TR[AÁ]NSITO\s+Y\s+TRANSPORTE(\s+(DE|DEL))?|SECRETAR[IÍ]A\s+DE\s+TR[AÁ]NSITO\s+Y\s+TRANSPORTE(\s+(DE|DEL))?|SECRETAR[IÍ]A\s+DE\s+TRANSPORTES?\s+Y\s+TR[AÁ]NSITO(\s+(DE|DEL))?|DIRECCI[OÓ]N\s+DE\s+TR[AÁ]NSITO(\s+Y\s+TRANSPORTE)?(\s+(DE|DEL))?|INSTITUTO\s+DE\s+TR[AÁ]NSITO(\s+Y\s+TRANSPORTE)?(\s+(DE|DEL))?)\s*/i;

    limpio = limpio.replace(regex, '').trim();
    limpio = limpio.replace(/^(DE|DEL)\s+/i, '').trim();

    return limpio || nombre;
  }

  private procesarRespuestaApi(data: ConsultaVehicularData, tipoDocId: number): void {
    const prop = data.propietario;
    const veh = data.vehiculo;
    const rel = data.relacionPropietario;
    const rawLiqs = data.liquidaciones || [];
    const rawHist = data.historial || [];
    const rawNov = data.novedades || [];

    // Tipo de Documento Nombre
    const tipoDocOpc = TIPOS_DOCUMENTO_OPCIONES.find(t => t.id === (prop?.tipoDocumentoId || tipoDocId));
    const tipoDocStr = tipoDocOpc ? `${tipoDocOpc.nombre} (${tipoDocOpc.codigo})` : 'Cédula de Ciudadanía (CC)';

    // Organismo de tránsito / Municipio formateado limpiando prefijos
    const organismoTransitoLimpio = this.limpiarNombreOrganismoTransito(veh?.organismoTransitoNombre);

    // Mapear liquidaciones
    const liquidacionesMapped: LiquidacionCiudadano[] = rawLiqs.map((l, index) => {
      const valor = Number(l.valor) || 0;
      const estadoUpper = (l.estado || '').toUpperCase();
      const esPagada = valor === 0 || estadoUpper.includes('PAGAD') || estadoUpper.includes('SATISFECH');
      return {
        id: `liq-${index + 1}`,
        vigencia: l.vigencia,
        placa: l.placa,
        detalle: l.detalle || `Vigencia ${l.vigencia}`,
        valor,
        estado: l.estado,
        esPagada
      };
    });

    // Calcular deuda total y estado general
    const deudasPendientes = liquidacionesMapped.filter(l => !l.esPagada && l.valor > 0);
    const totalDeuda = deudasPendientes.reduce((acc, curr) => acc + curr.valor, 0);
    const estadoGeneral: 'Al día' | 'Pendiente' = (deudasPendientes.length === 0 && totalDeuda === 0) ? 'Al día' : 'Pendiente';

    // Mapear historial
    const historialMapped: HistorialCiudadano[] = rawHist.map(h => ({
      fecha: h.fecha,
      accion: h.accion,
      usuario: h.usuario
    }));

    // Mapear novedades
    const novedadesMapped: NovedadCiudadano[] = rawNov.map(n => ({
      tipo: n.tipoNovedad,
      detalle: n.detalle,
      fecha: n.fecha
    }));

    // Mapear certificados solo para las vigencias pagadas
    const vigenciasPagadas = liquidacionesMapped.filter(l => l.esPagada);
    const fechaEmisionStr = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const certificadosMapped: CertificadoCiudadano[] = vigenciasPagadas.map((l, idx) => ({
      id: `cert-${l.vigencia}-${idx}`,
      tipo: `Paz y Salvo Impuesto Vehicular - Vigencia ${l.vigencia}`,
      vigencia: l.vigencia,
      placa: veh?.placa || l.placa,
      fecha: fechaEmisionStr,
      codigo: `CERT-${l.vigencia}-${l.placa}-${Math.floor(1000 + Math.random() * 9000)}`
    }));

    this.ciudadano.set({
      propietario: {
        nombre: prop?.nombreCompleto || 'No especificado',
        tipoDocumentoId: prop?.tipoDocumentoId || tipoDocId,
        tipoDocumentoNombre: tipoDocStr,
        documento: prop?.numeroDocumento || '',
        email: prop?.correoElectronico || null,
        telefono: prop?.telefono || null,
        direccion: prop?.direccion || null,
        ciudad: prop?.ciudad || null,
        activo: prop?.activo ?? true
      },
      relacion: {
        tipoVinculo: rel?.tipoVinculoNombre || 'Propietario',
        porcentaje: rel?.porcentajePropiedad ?? 100,
        esResponsable: rel?.esResponsablePrincipal ?? true,
        fechaInicio: rel?.fechaInicio || null
      },
      vehiculo: {
        id: veh?.id,
        placa: veh?.placa,
        marca: veh?.marca || 'No registrada',
        linea: veh?.linea || 'No registrada',
        modelo: veh?.modelo || 0,
        cilindraje: veh?.cilindraje || 0,
        tipoVehiculo: veh?.tipoVehiculo || null,
        clase: veh?.clase || null,
        servicio: veh?.servicio || 'Particular',
        combustible: veh?.combustible || null,
        pasajeros: veh?.pasajeros || null,
        fechaMatricula: veh?.fechaMatricula || null,
        estadoMatriculaNombre: veh?.estadoMatriculaNombre || 'Matrícula Activa',
        organismoTransitoNombre: organismoTransitoLimpio || null,
        estadoGeneral,
        deudaTotal: totalDeuda,
        liquidaciones: liquidacionesMapped,
        historial: historialMapped,
        novedades: novedadesMapped
      },
      certificados: certificadosMapped
    });

    this.activeTab.set('inicio');
    this.isConsulted.set(true);
  }

  cambiarTab(tab: 'inicio' | 'historial' | 'liquidaciones' | 'certificados'): void {
    this.activeTab.set(tab);
  }

  abrirPago(liq: LiquidacionCiudadano): void {
    this.liquidacionParaPagar.set(liq);
  }

  cerrarPago(): void {
    this.liquidacionParaPagar.set(null);
  }

  nuevaConsulta(): void {
    this.isConsulted.set(false);
    this.ciudadano.set(null);
    this.activeTab.set('inicio');
  }

  salir(): void {
    this.router.navigate(['/']);
  }
}
