import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { 
  ConsultaCiudadanaSharedComponent, 
  ConsultaSubmitPayload 
} from '../../../../../shared/components/consulta-ciudadana/consulta-ciudadana-shared';
import { DeclaracionDeguelloData, PlantaBeneficio } from '../../../domain/models/deguello.model';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { FacturaModalComponent } from '../../components/factura-modal/factura-modal';

@Component({
  selector: 'app-deguello-portal-ciudadano',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    ConsultaCiudadanaSharedComponent, 
    FacturaModalComponent
  ],
  templateUrl: './deguello-portal-ciudadano.html',
})
export class DeguelloPortalCiudadanoComponent implements OnInit {
  private deguelloService = inject(DeguelloService);
  private router = inject(Router);

  /** Modo de vista: 'login' (Autogestión PBA) | 'dashboard' (Portal Empresa) | 'consulta_publica' (Puntual ICA) */
  readonly modoVista = signal<'login' | 'dashboard' | 'consulta_publica'>('login');

  /** Formulario de Login Genérico */
  readonly loginNit = signal<string>('900823411');
  readonly loginClave = signal<string>('123456');
  readonly loginError = signal<string>('');

  /** Empresa autenticada en el servicio */
  readonly empresaActiva = computed(() => this.deguelloService.empresaAutenticada());

  /** Catálogo de plantas demo autorizadas para acceso rápido en 1 clic */
  readonly plantasDemo = [
    {
      nombre: 'Frigorífico Regional de Popayán S.A.S.',
      nit: '900823411',
      municipio: 'POPAYÁN',
      invima: 'INV-PBA-19001',
      capacidad: 120,
      icono: 'fa-building-columns'
    },
    {
      nombre: 'Planta de Beneficio Animal Regional Patía',
      nit: '10548920',
      municipio: 'PATÍA - EL BORDO',
      invima: 'INV-PBA-19517',
      capacidad: 60,
      icono: 'fa-wheat-awn'
    },
    {
      nombre: 'Frigorífico Santander de Quilichao',
      nit: '76321450',
      municipio: 'SANTANDER DE QUILICHAO',
      invima: 'INV-PBA-19698',
      capacidad: 85,
      icono: 'fa-industry'
    },
    {
      nombre: 'Matadero Municipal de Bolívar',
      nit: '891500987',
      municipio: 'BOLÍVAR',
      invima: 'INV-PBA-19100',
      capacidad: 40,
      icono: 'fa-mountain'
    }
  ];

  /** Control de visualización */
  readonly isConsulted = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  /** Criterio ingresado en la búsqueda */
  readonly criterioBusqueda = signal<{ doc: string; guia: string; tipoDoc: number } | null>(null);

  /** Lista de declaraciones encontradas */
  readonly declaraciones = signal<DeclaracionDeguelloData[]>([]);

  /** Filtro de estado para la lista de resultados */
  readonly filtroEstado = signal<'TODAS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA'>('TODAS');

  /** Declaración activa para visualizar/imprimir en el modal */
  readonly declaracionSeleccionadaParaFactura = signal<DeclaracionDeguelloData | null>(null);

  /** Información del contribuyente a partir de la empresa o de los resultados */
  readonly contribuyenteInfo = computed(() => {
    const emp = this.empresaActiva();
    if (emp) {
      return {
        razonSocial: emp.nombre,
        nit: emp.nit || '',
        dv: '9',
        municipio: emp.municipio,
        direccion: emp.direccion,
        telefono: emp.telefono,
        representante: emp.representanteLegal || 'REPRESENTANTE LEGAL REGISTRADO',
        docRepresentante: emp.docRepresentante || emp.nit || '',
        emailOficial: emp.emailOficial || `tributario@${(emp.nit || 'cauca')}.gov.co`,
        codigoInvima: emp.codigoInvima || 'INV-PBA-CAUCA',
        capacidadDiaria: emp.capacidadDiariaCabezas || 60,
        esFrigorifico: !!emp.esFrigorificoRegional,
        predioOrigen: 'Predios Autorizados del Departamento del Cauca',
        plantaBeneficio: emp.nombre
      };
    }
    const list = this.declaraciones();
    if (list.length === 0) return null;
    const item = list[0];
    return {
      razonSocial: item.razonSocial,
      nit: item.nit,
      dv: item.dv,
      municipio: item.municipio,
      direccion: item.direccionNotificacion,
      telefono: item.telefonoFijo,
      representante: item.nombreRepresentante,
      docRepresentante: item.numeroDocRepresentante,
      emailOficial: '',
      codigoInvima: '',
      capacidadDiaria: 0,
      esFrigorifico: false,
      predioOrigen: item.predioOrigen,
      plantaBeneficio: item.plantaBeneficio,
    };
  });

  /** Conteo y totales */
  readonly totalDeclaraciones = computed(() => this.declaraciones().length);

  readonly totalCabezas = computed(() => {
    return this.declaraciones().reduce((acc, curr) => acc + curr.baseGravable, 0);
  });

  readonly countRadicadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RADICADA').length;
  });

  readonly countPendientes = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'PENDIENTE').length;
  });

  readonly countPagadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'PAGADO').length;
  });

  readonly countVencidas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'VENCIDO').length;
  });

  readonly countReliquidadas = computed(() => {
    return this.declaraciones().filter((d) => d.estadoPago === 'RELIQUIDADA').length;
  });

  readonly totalPendientePagar = computed(() => {
    return this.declaraciones()
      .filter((d) => d.estadoPago === 'PENDIENTE')
      .reduce((acc, curr) => acc + curr.totalAPagar, 0);
  });

  /** Determina si es una consulta puntual de una guía ICA / formulario específico */
  readonly esBusquedaPuntual = computed(() => {
    const crit = this.criterioBusqueda();
    const tieneGuia = !!crit?.guia && crit.guia.trim().length > 0;
    return tieneGuia || this.declaraciones().length === 1;
  });

  /** Declaraciones filtradas según el tab seleccionado */
  readonly declaracionesFiltradas = computed(() => {
    const estado = this.filtroEstado();
    if (estado === 'TODAS') {
      return this.declaraciones();
    }
    return this.declaraciones().filter((d) => d.estadoPago === estado);
  });

  ngOnInit(): void {
    const emp = this.deguelloService.empresaAutenticada();
    if (emp && emp.nit) {
      this.modoVista.set('dashboard');
      this.isConsulted.set(true);
      this.criterioBusqueda.set({
        doc: emp.nit,
        guia: '',
        tipoDoc: 1,
      });
      this.recargarDeclaraciones(emp.nit, '');
    }
  }

  /** Selección rápida de una de las 4 plantas de beneficio autorizadas en Cauca */
  seleccionarPlantaDemo(planta: { nit: string }): void {
    this.loginNit.set(planta.nit);
    this.iniciarSesion(planta.nit);
  }

  /** Iniciar sesión genérico de empresa / planta sin validaciones complejas */
  iniciarSesion(nitOverride?: string): void {
    const nit = (nitOverride || this.loginNit()).trim();
    if (!nit) {
      this.loginError.set('Por favor ingrese el NIT de la planta de beneficio o empresa.');
      return;
    }

    this.loginError.set('');
    this.isLoading.set(true);

    this.deguelloService.loginEmpresa(nit, this.loginClave()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.planta) {
          this.criterioBusqueda.set({
            doc: res.planta.nit || nit,
            guia: '',
            tipoDoc: 1,
          });
          this.modoVista.set('dashboard');
          this.isConsulted.set(true);
          this.recargarDeclaraciones(res.planta.nit || nit, '');
        } else {
          this.loginError.set(res.message || 'Error al iniciar sesión.');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.loginError.set('No se pudo establecer conexión con el servidor.');
      }
    });
  }

  /** Cierre de sesión de la empresa */
  cerrarSesion(): void {
    this.deguelloService.setEmpresaAutenticada(null);
    this.declaraciones.set([]);
    this.criterioBusqueda.set(null);
    this.filtroEstado.set('TODAS');
    this.declaracionSeleccionadaParaFactura.set(null);
    this.modoVista.set('login');
    this.isConsulted.set(false);
  }

  /** Radicar una nueva guía desde el portal de la empresa */
  radicarNuevaGuia(): void {
    this.router.navigate(['/deguello/liquidacion']);
  }

  /** Navegar a la consulta pública por guía ICA */
  irAConsultaPublica(): void {
    this.modoVista.set('consulta_publica');
  }

  /** Volver a la pantalla de login de empresa */
  volverALogin(): void {
    this.modoVista.set('login');
  }

  /** Al ejecutar la consulta desde el componente compartido */
  alConsultar(payload: ConsultaSubmitPayload): void {
    this.isLoading.set(true);
    this.criterioBusqueda.set({
      doc: payload.numeroDocumento,
      guia: payload.secondaryValue,
      tipoDoc: payload.tipoDocumento,
    });
    this.modoVista.set('dashboard');
    this.recargarDeclaraciones(payload.numeroDocumento, payload.secondaryValue);
  }

  private recargarDeclaraciones(doc: string, guia: string): void {
    this.isLoading.set(true);
    this.deguelloService
      .consultarDeclaracionesCiudadano(doc, guia)
      .subscribe({
        next: (res) => {
          this.declaraciones.set(res);
          this.isConsulted.set(true);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al consultar declaraciones de degüello:', err);
          this.declaraciones.set([]);
          this.isConsulted.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /** Volver a la pantalla de consulta inicial */
  nuevaConsulta(): void {
    if (this.empresaActiva()) {
      const nit = this.empresaActiva()?.nit || '';
      this.recargarDeclaraciones(nit, '');
    } else {
      this.cerrarSesion();
    }
  }

  /** Cambiar filtro de estado */
  setFiltro(estado: 'TODAS' | 'RADICADA' | 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'RELIQUIDADA'): void {
    this.filtroEstado.set(estado);
  }

  /** Abrir modal de factura oficial para visualización e impresión */
  verFactura(d: DeclaracionDeguelloData): void {
    this.declaracionSeleccionadaParaFactura.set(d);
  }

  /** Cerrar modal de factura */
  cerrarModalFactura(): void {
    this.declaracionSeleccionadaParaFactura.set(null);
  }

  // --- BOTÓN DIRECTO DE PAGO (SIN PANTALLA INTERMEDIA) ---
  pagar(d: DeclaracionDeguelloData): void {
    if (d.estadoPago !== 'PENDIENTE') return;

    const ref = `PSE-${Math.floor(100000000 + Math.random() * 900000000)}`;
    this.deguelloService.marcarComoPagada(d.consecutivo, ref).subscribe({
      next: (ok) => {
        if (ok) {
          const crit = this.criterioBusqueda();
          if (crit) {
            this.recargarDeclaraciones(crit.doc, crit.guia);
          }
        }
      }
    });
  }

  // --- RELIQUIDAR DESDE EL PORTAL CIUDADANO ---
  reliquidar(d: DeclaracionDeguelloData): void {
    this.deguelloService.setDeclaracionEnEdicion(d);
    this.router.navigate(['/deguello/liquidacion']);
  }
}
