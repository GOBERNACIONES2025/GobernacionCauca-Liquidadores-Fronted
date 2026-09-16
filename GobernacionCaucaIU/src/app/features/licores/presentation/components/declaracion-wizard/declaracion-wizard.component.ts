import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntidadProductora, InformacionTransporte, ProductoLicor, VehiculoTransporte } from '../../../domain/models/licores.models';
import { calcularLiquidacionItem, formatCurrencyCop } from '../../../domain/calculator/licores-tax-calculator';

export interface ItemFormWizard {
  producto: ProductoLicor;
  cantidad: number;
  calculo: ReturnType<typeof calcularLiquidacionItem>;
}

@Component({
  selector: 'app-declaracion-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './declaracion-wizard.component.html',
})
export class DeclaracionWizardComponent implements OnInit {
  @Input({ required: true }) entidad!: EntidadProductora;
  @Input({ required: true }) catalogo: ProductoLicor[] = [];
  @Output() radicadoCreado = new EventEmitter<{
    transporte: InformacionTransporte;
    items: { producto: ProductoLicor; cantidad: number }[];
  }>();
  @Output() cerrar = new EventEmitter<void>();

  pasoActual = signal<number>(1);

  // Paso 1: Transporte
  transporte: InformacionTransporte = {
    departamentoOrigen: 'Antioquia',
    municipioOrigen: 'Itagüí',
    departamentoDestino: 'Cauca',
    municipioDestino: 'Popayán',
    direccionDestino: 'Zona Industrial Popayán - Manzana B Lote 4',
    empresaTransportadora: 'Transportes del Sur S.A.S.',
    nitTransportador: '890123456-7',
    nombreConductor: 'Carlos Mario Morales',
    cedulaConductor: '71.234.567',
    telefonoConductor: '312 456 7890',
    placaVehiculo: 'WXY-789',
    placaRemolque: 'R-99412',
    tipoVehiculo: 'Furgón 2 Ejes 10 Ton',
    rutaAutorizada: 'Medellín - Pereira - Cali - Santander de Quilichao - Popayán (Vía Panamericana)',
    tiempoEstimadoHoras: 14,
    vehiculos: [],
  };

  // Flota de Vehículos Asignados al Lote
  vehiculos: VehiculoTransporte[] = [
    {
      id: 'veh-1',
      placaVehiculo: 'WXY-789',
      placaRemolque: 'R-99412',
      tipoVehiculo: 'Furgón 2 Ejes 10 Ton',
      nombreConductor: 'Carlos Mario Morales',
      cedulaConductor: '71.234.567',
      telefonoConductor: '312 456 7890',
      numeroPrecintoSeguridad: 'PRC-2026-8812',
      botellasAsignadas: 300,
    },
  ];

  // Nuevo vehículo form
  nuevoVehiculoPlaca = '';
  nuevoVehiculoRemolque = '';
  nuevoVehiculoTipo = 'Camión Sencillo 2 Ejes (8 Ton)';
  nuevoVehiculoConductor = '';
  nuevoVehiculoCedula = '';
  nuevoVehiculoTelefono = '';
  nuevoVehiculoPrecinto = '';
  nuevoVehiculoBotellas = 200;

  tiposVehiculoDisponibles = [
    'Tractocamión / Tractomula 3 Ejes (32 Ton)',
    'Furgón 2 Ejes 10 Ton (Refrigerado/Seco)',
    'Camión Sencillo 2 Ejes (8 Ton)',
    'Camión Doble Troque 3 Ejes (18 Ton)',
    'Camioneta Furgón 3.5 Ton',
  ];

  municipiosCauca = [
    'Popayán',
    'Santander de Quilichao',
    'Puerto Tejada',
    'El Bordo - Patía',
    'Piendamó',
    'Timbío',
    'Guapi',
    'Bolívar',
    'Silvia',
    'Miranda',
    'Caloto',
    'Corinto',
  ];

  // Paso 2: Lote
  productoSeleccionadoId = '';
  cantidadBotellasInput: number = 300;
  itemsLote: ItemFormWizard[] = [];

  ngOnInit(): void {
    if (this.entidad) {
      this.transporte.departamentoOrigen = this.entidad.departamentoOrigen;
      this.transporte.municipioOrigen = this.entidad.municipioOrigen;
    }
    this.sincronizarTransportePrincipal();
    if (this.catalogo.length > 0) {
      this.productoSeleccionadoId = this.catalogo[0].id;
      // Agregar un producto por defecto al lote para que sea interactivo de inmediato
      const primerProd = this.catalogo[0];
      const calculo = calcularLiquidacionItem(primerProd, 300);
      this.itemsLote.push({
        producto: primerProd,
        cantidad: 300,
        calculo,
      });
    }
  }

  agregarVehiculo(): void {
    if (!this.nuevoVehiculoPlaca.trim() || !this.nuevoVehiculoConductor.trim()) {
      alert('Por favor ingrese al menos la Placa del vehículo y el Nombre del Conductor.');
      return;
    }
    const nuevo: VehiculoTransporte = {
      id: `veh-${Date.now()}`,
      placaVehiculo: this.nuevoVehiculoPlaca.trim().toUpperCase(),
      placaRemolque: this.nuevoVehiculoRemolque.trim().toUpperCase() || undefined,
      tipoVehiculo: this.nuevoVehiculoTipo,
      nombreConductor: this.nuevoVehiculoConductor.trim(),
      cedulaConductor: this.nuevoVehiculoCedula.trim() || '1.000.000.000',
      telefonoConductor: this.nuevoVehiculoTelefono.trim() || '310 000 0000',
      numeroPrecintoSeguridad: this.nuevoVehiculoPrecinto.trim().toUpperCase() || `PRC-${Date.now().toString().slice(-4)}`,
      botellasAsignadas: Number(this.nuevoVehiculoBotellas) || 0,
    };
    this.vehiculos.push(nuevo);
    this.sincronizarTransportePrincipal();
    this.limpiarNuevoVehiculo();
  }

  eliminarVehiculo(idx: number): void {
    if (this.vehiculos.length <= 1) {
      alert('Debe haber al menos un vehículo asignado para la movilización del lote.');
      return;
    }
    this.vehiculos.splice(idx, 1);
    this.sincronizarTransportePrincipal();
  }

  sincronizarTransportePrincipal(): void {
    if (this.vehiculos.length > 0) {
      const v = this.vehiculos[0];
      this.transporte.placaVehiculo = v.placaVehiculo;
      this.transporte.placaRemolque = v.placaRemolque;
      this.transporte.tipoVehiculo = v.tipoVehiculo;
      this.transporte.nombreConductor = v.nombreConductor;
      this.transporte.cedulaConductor = v.cedulaConductor;
      this.transporte.telefonoConductor = v.telefonoConductor || '';
      this.transporte.vehiculos = [...this.vehiculos];
    }
  }

  limpiarNuevoVehiculo(): void {
    this.nuevoVehiculoPlaca = '';
    this.nuevoVehiculoRemolque = '';
    this.nuevoVehiculoConductor = '';
    this.nuevoVehiculoCedula = '';
    this.nuevoVehiculoTelefono = '';
    this.nuevoVehiculoPrecinto = '';
    this.nuevoVehiculoBotellas = 200;
  }

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  agregarProductoAlLote(): void {
    const prod = this.catalogo.find((p) => p.id === this.productoSeleccionadoId);
    if (!prod || this.cantidadBotellasInput <= 0) return;

    // Verificar si ya existe en el lote para sumar cantidad
    const existenteIdx = this.itemsLote.findIndex((it) => it.producto.id === prod.id);
    if (existenteIdx !== -1) {
      const nuevaCantidad = this.itemsLote[existenteIdx].cantidad + Number(this.cantidadBotellasInput);
      this.itemsLote[existenteIdx].cantidad = nuevaCantidad;
      this.itemsLote[existenteIdx].calculo = calcularLiquidacionItem(prod, nuevaCantidad);
    } else {
      const calculo = calcularLiquidacionItem(prod, Number(this.cantidadBotellasInput));
      this.itemsLote.push({
        producto: prod,
        cantidad: Number(this.cantidadBotellasInput),
        calculo,
      });
    }
  }

  eliminarItem(idx: number): void {
    this.itemsLote.splice(idx, 1);
  }

  cambiarCantidadItem(idx: number, delta: number): void {
    const it = this.itemsLote[idx];
    const nuevaCant = it.cantidad + delta;
    if (nuevaCant >= 1) {
      it.cantidad = nuevaCant;
      it.calculo = calcularLiquidacionItem(it.producto, nuevaCant);
    }
  }

  get totalBotellas(): number {
    return this.itemsLote.reduce((acc, it) => acc + it.cantidad, 0);
  }

  get subtotalEspecifico(): number {
    return this.itemsLote.reduce((acc, it) => acc + it.calculo.subtotalEspecifico, 0);
  }

  get subtotalAdValorem(): number {
    return this.itemsLote.reduce((acc, it) => acc + it.calculo.subtotalAdValorem, 0);
  }

  get subtotalIva(): number {
    return this.itemsLote.reduce((acc, it) => acc + it.calculo.subtotalIva, 0);
  }

  get totalPagar(): number {
    return this.itemsLote.reduce((acc, it) => acc + it.calculo.totalItem, 0);
  }

  irAlPaso(paso: number): void {
    if (paso === 2 && (!this.transporte.placaVehiculo || !this.transporte.nombreConductor)) {
      return;
    }
    if (paso === 3 && this.itemsLote.length === 0) {
      return;
    }
    this.pasoActual.set(paso);
  }

  radicar(): void {
    if (this.itemsLote.length === 0) return;

    this.radicadoCreado.emit({
      transporte: this.transporte,
      items: this.itemsLote.map((it) => ({
        producto: it.producto,
        cantidad: it.cantidad,
      })),
    });
  }
}
