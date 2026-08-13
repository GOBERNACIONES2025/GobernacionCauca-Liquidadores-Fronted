import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  matricula: string;
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
export class PortalCiudadano {
  // Selector de Rol: Ciudadano vs Administrador
  readonly tipoUsuario = signal<'CIUDADANO' | 'ADMIN'>('CIUDADANO');

  // Form signals - Ciudadano
  readonly tipoDocumento = signal<string>('CC');
  readonly numeroCedula = signal<string>('');
  readonly numeroMatricula = signal<string>('');
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

  // Filtro dentro de liquidaciones
  readonly filtroEstadoLiquidacion = signal<'TODAS' | 'PENDIENTE' | 'PAGADA'>('TODAS');

  // Modal para detalle de vehículo
  readonly vehiculoSeleccionado = signal<VehiculoCiudadano | null>(null);

  // Modal para pago
  readonly liquidacionParaPagar = signal<Liquidacion | null>(null);

  // Datos del ciudadano mapeados
  readonly ciudadano = signal<CiudadanoData | null>(null);

  constructor(private router: Router) {}

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
      // Redirige al expediente vehicular / panel administrativo
      this.router.navigate(['/automotores/vehiculos']);
    }, 600);
  }

  cargarEjemplo(ejemplo: 'carlos' | 'samuel'): void {
    if (ejemplo === 'carlos') {
      this.tipoDocumento.set('CC');
      this.numeroCedula.set('12.456.789');
      this.numeroMatricula.set('MAT-2024-0091');
      this.placaVehiculo.set('QWE-123');
    } else {
      this.tipoDocumento.set('CC');
      this.numeroCedula.set('1.035.421.980');
      this.numeroMatricula.set('MAT-2023-4512');
      this.placaVehiculo.set('HJK-892');
    }
    this.consultar();
  }

  consultar(): void {
    const cedula = this.numeroCedula().trim();
    const matricula = this.numeroMatricula().trim();
    const placa = this.placaVehiculo().trim().toUpperCase();

    if (!cedula || !matricula || !placa) {
      this.errorMessage.set('Por favor complete los campos requeridos para consultar.');
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    setTimeout(() => {
      this.isLoading.set(false);
      this.isConsulted.set(true);

      const esCarlos = cedula.includes('12') || placa.includes('QWE');

      const vehiculosData: VehiculoCiudadano[] = [
        {
          placa: 'QWE-123',
          marca: 'Chevrolet',
          linea: 'Spark GT',
          modelo: 2021,
          tipo: 'Automóvil',
          servicio: 'Particular',
          cilindraje: '1200 cc',
          estado: 'Al día',
          liquidaciones: [
            {
              id: 'liq-1',
              vigencia: 2024,
              referencia: 'LIQ-2024-09841',
              concepto: 'Impuesto sobre Vehículos Automotores + Sobretasa',
              fecha: '15 May 2024',
              valor: 265000,
              estado: 'PAGADA',
            },
            {
              id: 'liq-2',
              vigencia: 2023,
              referencia: 'LIQ-2023-44120',
              concepto: 'Impuesto sobre Vehículos Automotores',
              fecha: '20 Jun 2023',
              valor: 242000,
              estado: 'PAGADA',
            },
            {
              id: 'liq-3',
              vigencia: 2022,
              referencia: 'LIQ-2022-11094',
              concepto: 'Impuesto sobre Vehículos Automotores',
              fecha: '12 May 2022',
              valor: 220000,
              estado: 'PAGADA',
            },
          ],
        },
        {
          placa: 'RTY-456',
          marca: 'Honda',
          linea: 'CB190R',
          modelo: 2020,
          tipo: 'Motocicleta',
          servicio: 'Particular',
          cilindraje: '190 cc',
          estado: 'Pendiente',
          deuda: 486000,
          liquidaciones: [
            {
              id: 'liq-4',
              vigencia: 2024,
              referencia: 'LIQ-2024-11894',
              concepto: 'Impuesto Departamental de Rodamiento y Semaforización',
              fecha: '02 Ene 2024',
              fechaVencimiento: '30 de junio de 2024',
              valor: 486000,
              descuento: 48600,
              estado: 'PENDIENTE',
            },
            {
              id: 'liq-5',
              vigencia: 2023,
              referencia: 'LIQ-2023-88741',
              concepto: 'Impuesto Departamental de Rodamiento',
              fecha: '18 May 2023',
              valor: 195000,
              estado: 'PAGADA',
            },
          ],
        },
        {
          placa: 'OPL-789',
          marca: 'Renault',
          linea: 'Duster',
          modelo: 2019,
          tipo: 'Campero',
          servicio: 'Particular',
          cilindraje: '1600 cc',
          estado: 'Al día',
          liquidaciones: [
            {
              id: 'liq-6',
              vigencia: 2024,
              referencia: 'LIQ-2024-55102',
              concepto: 'Impuesto sobre Vehículos Automotores + Estampillas',
              fecha: '10 Abr 2024',
              valor: 380000,
              estado: 'PAGADA',
            },
            {
              id: 'liq-7',
              vigencia: 2023,
              referencia: 'LIQ-2023-33921',
              concepto: 'Impuesto sobre Vehículos Automotores',
              fecha: '25 May 2023',
              valor: 350000,
              estado: 'PAGADA',
            },
          ],
        },
      ];

      this.ciudadano.set({
        nombre: esCarlos ? 'Carlos Ramírez' : 'Samuel Díaz Pérez',
        tipoDocumento: this.tipoDocumento(),
        documento: cedula,
        ciudad: 'Popayán, Cauca',
        matricula: matricula,
        placaConsultada: placa,
        vehiculos: vehiculosData,
        certificados: [
          {
            id: 'cert-1',
            tipo: 'Estado de Cuenta',
            codigo: 'EST-2024-00412',
            placa: 'QWE-123',
            fecha: '15 May 2024',
          },
          {
            id: 'cert-2',
            tipo: 'Certificado de Pagos',
            codigo: 'PAG-2024-00389',
            placa: 'QWE-123',
            fecha: '10 May 2024',
          },
          {
            id: 'cert-3',
            tipo: 'Histórico de Pagos',
            codigo: 'HIS-2024-00201',
            placa: 'RTY-456',
            fecha: '02 May 2024',
          },
        ],
        actividades: [
          {
            titulo: 'Pago de impuesto realizado',
            placa: 'QWE-123',
            fecha: '15 May 2024',
            tipo: 'pago',
          },
          {
            titulo: 'Solicitud de traspaso enviada',
            placa: 'QWE-123',
            fecha: '10 May 2024',
            tipo: 'tramite',
          },
          {
            titulo: 'Certificado de pagos generado',
            fecha: '02 May 2024',
            tipo: 'certificado',
          },
        ],
      });
    }, 450);
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
