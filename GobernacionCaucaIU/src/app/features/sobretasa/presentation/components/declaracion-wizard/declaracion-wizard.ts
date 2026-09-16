import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DespachoItem,
  DistribuidorMayorista,
  EstacionServicioDestino,
  TipoCombustible,
} from '../../../domain/models/sobretasa-gasolina.models';
import { SobretasaService } from '../../../application/sobretasa.service';
import {
  calcularLiquidacionDespacho,
  calcularLiquidacionMensual,
  formatGalones,
  formatMoneyCop,
  TARIFAS_SOBRETASA_2026,
} from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-declaracion-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './declaracion-wizard.html',
})
export class DeclaracionWizardComponent implements OnInit {
  private sobretasaService = inject(SobretasaService);

  @Input() mayoristas: DistribuidorMayorista[] = [];
  @Input() edsCatalog: EstacionServicioDestino[] = [];
  @Output() cancelada = new EventEmitter<void>();
  @Output() radicada = new EventEmitter<string>(); // emite el ID de la declaración

  pasoActual = 1;
  tarifas = TARIFAS_SOBRETASA_2026;

  // Paso 1: Periodo y Mayorista
  periodoMes = new Date().getMonth() + 1; // Mes en curso o anterior
  periodoAnio = new Date().getFullYear();
  mayoristaSeleccionadoId = '';

  // Paso 2: Despachos agregados
  despachos: DespachoItem[] = [];

  // Formulario manual rápido
  nuevoGuia = '';
  nuevoFecha = new Date().toISOString().substring(0, 10);
  nuevoPlaca = '';
  nuevoTipo: TipoCombustible = 'GMC';
  nuevoGalones = 10000;
  nuevoEdsId = '';

  // Mensaje de feedback
  alertaMensaje: string | null = null;
  alertaTipo: 'success' | 'warning' | 'info' | 'error' = 'info';

  meses = [
    { num: 1, nombre: 'Enero' },
    { num: 2, nombre: 'Febrero' },
    { num: 3, nombre: 'Marzo' },
    { num: 4, nombre: 'Abril' },
    { num: 5, nombre: 'Mayo' },
    { num: 6, nombre: 'Junio' },
    { num: 7, nombre: 'Julio' },
    { num: 8, nombre: 'Agosto' },
    { num: 9, nombre: 'Septiembre' },
    { num: 10, nombre: 'Octubre' },
    { num: 11, nombre: 'Noviembre' },
    { num: 12, nombre: 'Diciembre' },
  ];

  anios = [2026, 2025, 2024];

  ngOnInit(): void {
    if (this.mayoristas.length > 0) {
      this.mayoristaSeleccionadoId = this.mayoristas[0].id;
    }
    if (this.edsCatalog.length > 0) {
      this.nuevoEdsId = this.edsCatalog[0].codigoSicomEds;
    }
    // Generar una guía de ejemplo para el formulario manual
    this.generarGuiaAleatoria();
  }

  generarGuiaAleatoria(): void {
    this.nuevoGuia = `SIC-${this.periodoAnio}-${Math.floor(10000 + Math.random() * 89999)}`;
    const placas = ['SZK-412', 'WFR-890', 'VRC-671', 'TKR-304', 'EQZ-115', 'WLZ-912'];
    this.nuevoPlaca = placas[Math.floor(Math.random() * placas.length)];
  }

  // Simular importación de archivo plano SICOM
  simularImportacionPlano(): void {
    const despachosSim = this.sobretasaService.simularImportacionSicom();
    this.despachos = [...this.despachos, ...despachosSim];
    this.mostrarAlerta(
      `✓ Se importaron exitosamente ${despachosSim.length} despachos de carrotanques desde el archivo plano SICOM MinMinas.`,
      'success'
    );
  }

  // Agregar despacho manual
  agregarDespachoManual(): void {
    if (!this.nuevoGuia || !this.nuevoPlaca || !this.nuevoGalones || this.nuevoGalones <= 0) {
      this.mostrarAlerta('Por favor completa todos los campos del despacho correctamente.', 'warning');
      return;
    }

    const eds = this.edsCatalog.find((e) => e.codigoSicomEds === this.nuevoEdsId);
    const calc = calcularLiquidacionDespacho(this.nuevoTipo, this.nuevoGalones);

    const item: DespachoItem = {
      id: `desp-man-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      codigoGuiaSicom: this.nuevoGuia.trim().toUpperCase(),
      fechaDespacho: this.nuevoFecha,
      placaVehiculo: this.nuevoPlaca.trim().toUpperCase(),
      tipoCombustible: this.nuevoTipo,
      galonesDespachados: this.nuevoGalones,
      codigoSicomEds: this.nuevoEdsId,
      estacionServicio: eds,
      tarifaMunicipalAplicada: calc.tarifaMunicipal,
      tarifaDepartamentalAplicada: calc.tarifaDepartamental,
      subtotalMunicipal: calc.subtotalMunicipal,
      subtotalDepartamental: calc.subtotalDepartamental,
      totalItem: calc.totalItem,
      validadoSicom: false,
    };

    this.despachos = [item, ...this.despachos];
    this.generarGuiaAleatoria();
    this.mostrarAlerta(`Despacho con guía ${item.codigoGuiaSicom} agregado a la preliquidación.`, 'info');
  }

  eliminarDespacho(index: number): void {
    this.despachos.splice(index, 1);
  }

  limpiarTodosDespachos(): void {
    if (confirm('¿Estás seguro de vaciar todos los despachos cargados?')) {
      this.despachos = [];
    }
  }

  // Liquidación calculada reactivamente
  get liquidacionConsolidada() {
    return calcularLiquidacionMensual(
      this.despachos,
      this.periodoMes,
      this.periodoAnio,
      new Date()
    );
  }

  get mayoristaActual(): DistribuidorMayorista | undefined {
    return this.mayoristas.find((m) => m.id === this.mayoristaSeleccionadoId);
  }

  // Navegación de pasos
  avanzarPaso(paso: number): void {
    if (paso === 2 && !this.mayoristaSeleccionadoId) {
      this.mostrarAlerta('Debes seleccionar el Distribuidor Mayorista.', 'warning');
      return;
    }
    if (paso === 3 && this.despachos.length === 0) {
      this.mostrarAlerta('Debes cargar o registrar al menos un despacho de combustible.', 'warning');
      return;
    }
    this.pasoActual = paso;
    this.alertaMensaje = null;
  }

  // Radicar la declaración
  radicar(): void {
    if (this.despachos.length === 0) {
      this.mostrarAlerta('No hay despachos para radicar.', 'warning');
      return;
    }

    const nueva = this.sobretasaService.radicarDeclaracion({
      periodoMes: this.periodoMes,
      periodoAnio: this.periodoAnio,
      mayoristaId: this.mayoristaSeleccionadoId,
      despachos: this.despachos,
    });

    this.radicada.emit(nueva.id);
  }

  mostrarAlerta(mensaje: string, tipo: 'success' | 'warning' | 'info' | 'error'): void {
    this.alertaMensaje = mensaje;
    this.alertaTipo = tipo;
    setTimeout(() => {
      if (this.alertaMensaje === mensaje) {
        this.alertaMensaje = null;
      }
    }, 6000);
  }

  formatCop(val: number): string {
    return formatMoneyCop(val);
  }

  formatGal(val: number): string {
    return formatGalones(val);
  }
}
