import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import { DeclaracionDeguelloData, PlantaBeneficio } from '../../../domain/models/deguello.model';
import { FacturaModalComponent } from '../../components/factura-modal/factura-modal';

@Component({
  selector: 'app-deguello-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FacturaModalComponent],
  templateUrl: './deguello-liquidacion.html',
})
export class DeguelloLiquidacionComponent implements OnInit {
  private deguelloService = inject(DeguelloService);
  private router = inject(Router);

  irAFacturacion(): void {
    this.router.navigate(['/deguello/facturacion']);
  }

  // Input para búsqueda rápida desde ICA (Inicia en blanco)
  readonly guiaIcaBusqueda = signal<string>('');
  readonly buscandoIca = signal<boolean>(false);
  readonly mensajeIca = signal<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  // Modal para ver/imprimir la factura oficial
  readonly declaracionParaModal = signal<DeclaracionDeguelloData | null>(null);

  // Plantas de Beneficio
  readonly plantas = signal<PlantaBeneficio[]>([]);

  // Señales reactivas para campos financieros y cálculo inmediato en vivo
  readonly baseGravable = signal<number | null>(null);
  readonly tarifa = signal<number>(49800);
  readonly sanciones = signal<number>(0);
  readonly interesMora = signal<number>(0);

  // Datos del formulario unificado de generación (Inicia completamente en blanco)
  formGeneracion = {
    anioGravable: 2026,
    periodoGravable: '09',
    esInicial: true,
    esCorreccion: false,
    declaracionCorregida: '',
    razonSocial: '',
    nit: '',
    dv: '',
    telefonoFijo: '',
    municipio: '',
    direccionNotificacion: '',
    numeroGuiaIca: '',
    plantaBeneficio: '',
    predioOrigen: '',
    especie: 'Bovino Macho Ceba',
    firmaContador: false,
    firmaRevisor: false,
    nombreRepresentante: '',
    tipoDocRep: 'CC' as 'CC' | 'CE',
    numeroDocRepresentante: '',
    nombreContadorORevisor: '',
    tipoDocContador: 'CC' as 'CC' | 'CE',
    numeroDocContadorORevisor: '',
    tarjetaProfesional: '',
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

  // Estado específico para Reliquidación / Corrección (Art. 644 E.T.)
  readonly declaracionOriginal = signal<DeclaracionDeguelloData | null>(null);
  readonly diasMora = signal<number>(18);
  readonly tasaMoraMensual = signal<number>(2.1); // 2.1% mensual aproximado

  readonly subtotalAnterior = computed(() => {
    return this.declaracionOriginal()?.subtotal || 0;
  });

  readonly cabezasAnteriores = computed(() => {
    return this.declaracionOriginal()?.baseGravable || 0;
  });

  readonly diferenciaCabezas = computed(() => {
    const actual = Number(this.baseGravable()) || 0;
    return actual - this.cabezasAnteriores();
  });

  readonly mayorValorImpuesto = computed(() => {
    const actualSubtotal = this.calculoEnVivo().subtotal;
    const anterior = this.subtotalAnterior();
    return Math.max(0, actualSubtotal - anterior);
  });

  // Cálculo en vivo del impuesto 100% reactivo a cada cambio en las señales
  readonly calculoEnVivo = computed(() => {
    const cabezas = Number(this.baseGravable()) || 0;
    const tar = Number(this.tarifa()) || 49800;
    const sanc = Number(this.sanciones()) || 0;
    const mora = Number(this.interesMora()) || 0;
    return this.deguelloService.calcularLiquidacion(cabezas, tar, sanc, mora);
  });

  ngOnInit(): void {
    // 1. Cargar catálogo de plantas
    this.deguelloService.listarPlantasBeneficio().subscribe((res) => {
      this.plantas.set(res);
    });

    // 2. Verificar si viene desde el botón "Reliquidar" en la pantalla de Facturación
    const edicion = this.deguelloService.declaracionEnEdicion();
    if (edicion) {
      this.cargarParaReliquidacion(edicion);
    }
  }

  onBaseGravableChange(val: any): void {
    const num = val === '' || val === null ? null : Number(val);
    this.baseGravable.set(num);
  }

  cargarParaReliquidacion(d: DeclaracionDeguelloData): void {
    this.declaracionOriginal.set(d);
    this.formGeneracion.esInicial = false;
    this.formGeneracion.esCorreccion = true;
    this.formGeneracion.declaracionCorregida = d.consecutivo;
    this.formGeneracion.razonSocial = d.razonSocial;
    this.formGeneracion.nit = d.nit;
    this.formGeneracion.dv = d.dv;
    this.formGeneracion.telefonoFijo = d.telefonoFijo;
    this.formGeneracion.municipio = d.municipio;
    this.formGeneracion.direccionNotificacion = d.direccionNotificacion;
    this.formGeneracion.numeroGuiaIca = d.numeroGuiaIca || '';
    this.formGeneracion.predioOrigen = d.predioOrigen || '';
    this.formGeneracion.plantaBeneficio = d.plantaBeneficio || '';
    this.formGeneracion.especie = d.especie || 'Bovino Macho Ceba';
    
    // Asignar señales reactivas
    this.baseGravable.set(d.baseGravable);
    this.tarifa.set(d.tarifa || 49800);
    this.sanciones.set(d.sanciones || 0);
    this.interesMora.set(d.interesMora || 0);

    this.formGeneracion.nombreRepresentante = d.nombreRepresentante;
    this.formGeneracion.numeroDocRepresentante = d.numeroDocRepresentante;
    this.formGeneracion.nombreContadorORevisor = d.nombreContadorORevisor;
    this.formGeneracion.numeroDocContadorORevisor = d.numeroDocContadorORevisor;
    this.formGeneracion.tarjetaProfesional = d.tarjetaProfesional;

    this.mensajeIca.set({
      texto: `Modo Corrección / Reliquidación activo sobre la Declaración en mora N° ${d.consecutivo}`,
      tipo: 'success',
    });
  }

  aplicarSancion10Porciento(): void {
    const mayor = this.mayorValorImpuesto();
    const base = mayor > 0 ? mayor : this.calculoEnVivo().subtotal;
    // 10% del mayor valor a pagar (Art. 644 E.T.)
    this.sanciones.set(Math.round(base * 0.1));
  }

  aplicarSancionMinima(): void {
    // Sanción mínima 10 UVT vigencia 2026 ($498.000)
    this.sanciones.set(498000);
  }

  calcularInteresesMoraAutomaticos(): void {
    const mayor = this.mayorValorImpuesto();
    const base = mayor > 0 ? mayor : this.calculoEnVivo().subtotal;
    const dias = Number(this.diasMora()) || 1;
    const tasaDiaria = (Number(this.tasaMoraMensual()) / 100) / 30;
    this.interesMora.set(Math.round(base * tasaDiaria * dias));
  }

  limpiarSancionesYMora(): void {
    this.sanciones.set(0);
    this.interesMora.set(0);
  }

  /**
   * Traer información desde el servicio de ICA SIGMA
   * y precargar automáticamente el formulario
   */
  traerDesdeIca(numeroGuia?: string): void {
    const guia = (numeroGuia || this.guiaIcaBusqueda()).trim().toUpperCase();
    if (!guia) {
      this.mensajeIca.set({ texto: 'Ingrese el número de guía ICA para consultar.', tipo: 'error' });
      return;
    }

    this.buscandoIca.set(true);
    this.mensajeIca.set(null);

    setTimeout(() => {
      this.deguelloService.importarDatosIca(guia).subscribe({
        next: (data) => {
          this.buscandoIca.set(false);
          if (data) {
            this.formGeneracion.razonSocial = data.razonSocial;
            this.formGeneracion.nit = data.nit;
            this.formGeneracion.dv = data.dv;
            this.formGeneracion.municipio = data.municipio;
            this.formGeneracion.direccionNotificacion = data.direccionNotificacion;
            this.formGeneracion.telefonoFijo = data.telefonoFijo;
            this.formGeneracion.numeroGuiaIca = data.numeroGuiaIca || guia;
            this.formGeneracion.plantaBeneficio = data.plantaBeneficio || this.formGeneracion.plantaBeneficio;
            this.formGeneracion.predioOrigen = data.predioOrigen || this.formGeneracion.predioOrigen;
            this.formGeneracion.especie = data.especie || 'Bovino Macho Ceba';

            this.baseGravable.set(data.baseGravable);
            this.tarifa.set(data.tarifa || 49800);
            this.sanciones.set(0);
            this.interesMora.set(0);

            this.mensajeIca.set({
              texto: `✅ Información de la Guía ICA "${guia}" importada exitosamente desde SIGMA (${data.baseGravable} Cabezas).`,
              tipo: 'success',
            });
          } else {
            this.mensajeIca.set({
              texto: `No se encontró la guía ICA "${guia}". Puede diligenciar los campos manualmente.`,
              tipo: 'error',
            });
          }
        },
        error: () => {
          this.buscandoIca.set(false);
          this.mensajeIca.set({ texto: 'Error al conectar con el servicio ICA SIGMA.', tipo: 'error' });
        },
      });
    }, 300);
  }

  seleccionarEjemploIca(numero: string): void {
    this.guiaIcaBusqueda.set(numero);
    this.traerDesdeIca(numero);
  }

  limpiarTodo(): void {
    this.formGeneracion.razonSocial = '';
    this.formGeneracion.nit = '';
    this.formGeneracion.dv = '';
    this.formGeneracion.telefonoFijo = '';
    this.formGeneracion.municipio = '';
    this.formGeneracion.direccionNotificacion = '';
    this.formGeneracion.numeroGuiaIca = '';
    this.formGeneracion.plantaBeneficio = '';
    this.formGeneracion.predioOrigen = '';
    this.formGeneracion.nombreRepresentante = '';
    this.formGeneracion.numeroDocRepresentante = '';
    this.formGeneracion.nombreContadorORevisor = '';
    this.formGeneracion.numeroDocContadorORevisor = '';
    this.formGeneracion.tarjetaProfesional = '';
    this.formGeneracion.esCorreccion = false;
    this.formGeneracion.esInicial = true;
    this.formGeneracion.declaracionCorregida = '';

    this.baseGravable.set(null);
    this.tarifa.set(49800);
    this.sanciones.set(0);
    this.interesMora.set(0);
    this.guiaIcaBusqueda.set('');
    this.mensajeIca.set(null);
    this.declaracionOriginal.set(null);
    this.deguelloService.setDeclaracionEnEdicion(null);
  }

  cancelarModoCorreccion(): void {
    this.limpiarTodo();
  }

  liquidarYGenerarFactura(): void {
    const cabezas = Number(this.baseGravable()) || 1;
    const datosFinales: Partial<DeclaracionDeguelloData> = {
      ...this.formGeneracion,
      baseGravable: cabezas,
      tarifa: Number(this.tarifa()) || 49800,
      sanciones: Number(this.sanciones()) || 0,
      interesMora: Number(this.interesMora()) || 0,
    };

    let declaracionEmitida: DeclaracionDeguelloData;

    if (this.formGeneracion.esCorreccion && this.formGeneracion.declaracionCorregida) {
      // Reliquidar sobre la anterior
      declaracionEmitida = this.deguelloService.reliquidarDeclaracion(
        this.formGeneracion.declaracionCorregida,
        datosFinales
      );
    } else {
      // Crear nueva normal
      declaracionEmitida = this.deguelloService.crearDeclaracionManual(datosFinales);
    }

    // Abrir el modal visor con la plantilla HTML provista
    this.declaracionParaModal.set(declaracionEmitida);
  }

  cerrarFacturaModal(): void {
    this.declaracionParaModal.set(null);
    // Redirigir a la vista de facturación para ver el estado de la cuenta
    this.router.navigate(['/deguello/facturacion']);
  }
}
