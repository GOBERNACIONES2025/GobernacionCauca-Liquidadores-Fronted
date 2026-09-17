import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DeclaracionSobretasa,
  DespachoItem,
  EstacionServicioDestino,
  TipoCombustible,
} from '../../../domain/models/sobretasa-gasolina.models';
import {
  calcularLiquidacionDespacho,
  calcularLiquidacionMensual,
  formatCurrencyCop,
} from '../../../domain/calculator/sobretasa-tax-calculator';

@Component({
  selector: 'app-sobretasa-subsanar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subsanar-modal.component.html',
})
export class SobretasaSubsanarModalComponent implements OnInit {
  @Input({ required: true }) declaracion!: DeclaracionSobretasa;
  @Input({ required: true }) edsCatalog: EstacionServicioDestino[] = [];
  @Output() subsanar = new EventEmitter<{
    id: string;
    despachos: DespachoItem[];
    motivo: string;
  }>();
  @Output() cerrar = new EventEmitter<void>();

  motivoSubsanacion = '';
  despachosEditables: DespachoItem[] = [];

  // Totales recalculados en vivo
  totalesCalculados = {
    totalGalonesGMC: 0,
    totalGalonesGME: 0,
    totalGalonesACPM: 0,
    totalGalonesGeneral: 0,
    totalMunicipal: 0,
    totalDepartamental: 0,
    subtotalImpuesto: 0,
    sancionExtemporaneidad: 0,
    totalPagar: 0,
  };

  tiposCombustible: { codigo: TipoCombustible; nombre: string }[] = [
    { codigo: 'GMC', nombre: 'Gasolina Motor Corriente' },
    { codigo: 'GME', nombre: 'Gasolina Motor Extra' },
    { codigo: 'ACPM', nombre: 'ACPM / Diésel' },
  ];

  ngOnInit(): void {
    // Clon profundo de despachos para no mutar el estado antes de guardar
    this.despachosEditables = this.declaracion.despachos.map((d, idx) => ({
      id: d.id || `desp-sub-${Date.now()}-${idx}`,
      codigoGuiaSicom: d.codigoGuiaSicom,
      fechaDespacho: d.fechaDespacho,
      placaVehiculo: d.placaVehiculo,
      tipoCombustible: d.tipoCombustible,
      galonesDespachados: d.galonesDespachados,
      codigoSicomEds: d.codigoSicomEds,
      estacionServicio: d.estacionServicio || this.buscarEds(d.codigoSicomEds),
      tarifaMunicipalAplicada: d.tarifaMunicipalAplicada,
      tarifaDepartamentalAplicada: d.tarifaDepartamentalAplicada,
      subtotalMunicipal: d.subtotalMunicipal,
      subtotalDepartamental: d.subtotalDepartamental,
      totalItem: d.totalItem,
      validadoSicom: d.validadoSicom,
    }));

    this.recalcular();
  }

  buscarEds(codigoEds: string): EstacionServicioDestino | undefined {
    return this.edsCatalog.find((e) => e.codigoSicomEds === codigoEds);
  }

  onEdsChange(despacho: DespachoItem): void {
    despacho.estacionServicio = this.buscarEds(despacho.codigoSicomEds);
    this.recalcular();
  }

  cambiarGalones(idx: number, delta: number): void {
    const actual = this.despachosEditables[idx].galonesDespachados || 0;
    const nuevo = Math.max(100, actual + delta);
    this.despachosEditables[idx].galonesDespachados = nuevo;
    this.recalcularItem(idx);
  }

  recalcularItem(idx: number): void {
    const item = this.despachosEditables[idx];
    const calc = calcularLiquidacionDespacho(item.tipoCombustible, Number(item.galonesDespachados || 0));
    item.tarifaMunicipalAplicada = calc.tarifaMunicipal;
    item.tarifaDepartamentalAplicada = calc.tarifaDepartamental;
    item.subtotalMunicipal = calc.subtotalMunicipal;
    item.subtotalDepartamental = calc.subtotalDepartamental;
    item.totalItem = calc.totalItem;
    this.recalcular();
  }

  agregarDespacho(): void {
    const defaultEds = this.edsCatalog[0];
    const calc = calcularLiquidacionDespacho('GMC', 10000);
    const nuevo: DespachoItem = {
      id: `desp-new-${Date.now()}`,
      codigoGuiaSicom: `SIC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      fechaDespacho: new Date().toISOString().slice(0, 10),
      placaVehiculo: 'SZK-412',
      tipoCombustible: 'GMC',
      galonesDespachados: 10000,
      codigoSicomEds: defaultEds ? defaultEds.codigoSicomEds : '110204',
      estacionServicio: defaultEds,
      tarifaMunicipalAplicada: calc.tarifaMunicipal,
      tarifaDepartamentalAplicada: calc.tarifaDepartamental,
      subtotalMunicipal: calc.subtotalMunicipal,
      subtotalDepartamental: calc.subtotalDepartamental,
      totalItem: calc.totalItem,
      validadoSicom: false,
    };
    this.despachosEditables.push(nuevo);
    this.recalcular();
  }

  eliminarDespacho(idx: number): void {
    if (this.despachosEditables.length <= 1) return;
    this.despachosEditables.splice(idx, 1);
    this.recalcular();
  }

  recalcular(): void {
    const liq = calcularLiquidacionMensual(
      this.despachosEditables,
      this.declaracion.periodoMes,
      this.declaracion.periodoAnio,
      new Date(this.declaracion.fechaRadicacion)
    );

    this.totalesCalculados = {
      totalGalonesGMC: liq.totalGalonesGMC,
      totalGalonesGME: liq.totalGalonesGME,
      totalGalonesACPM: liq.totalGalonesACPM,
      totalGalonesGeneral: liq.totalGalonesGeneral,
      totalMunicipal: liq.totalMunicipal,
      totalDepartamental: liq.totalDepartamental,
      subtotalImpuesto: liq.subtotalImpuesto,
      sancionExtemporaneidad: liq.sancionExtemporaneidad,
      totalPagar: liq.totalPagar,
    };
  }

  formatMoney(val: number): string {
    return formatCurrencyCop(val);
  }

  guardarYReenviar(): void {
    if (!this.motivoSubsanacion.trim() || this.despachosEditables.length === 0) return;

    this.subsanar.emit({
      id: this.declaracion.id,
      despachos: this.despachosEditables,
      motivo: this.motivoSubsanacion.trim(),
    });
  }
}
