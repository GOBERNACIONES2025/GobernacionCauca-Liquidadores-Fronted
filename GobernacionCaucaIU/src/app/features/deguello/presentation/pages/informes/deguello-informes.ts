import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';
import {
  InformeMunicipioRecaudo,
  InformePlantaBeneficio,
  DeclaracionDeguelloData
} from '../../../domain/models/deguello.model';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-deguello-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deguello-informes.html',
})
export class DeguelloInformesComponent implements OnInit {
  private deguelloService = inject(DeguelloService);
  private toast = inject(ToastService);

  readonly tabActivo = signal<'municipios' | 'plantas' | 'cartera'>('municipios');
  readonly vigenciaSeleccionada = signal<number>(2026);
  readonly mesSeleccionado = signal<string>('TODOS');

  readonly informeMunicipios = signal<InformeMunicipioRecaudo[]>([]);
  readonly informePlantas = signal<InformePlantaBeneficio[]>([]);
  readonly listaDeclaraciones = signal<DeclaracionDeguelloData[]>([]);

  readonly busquedaMuni = signal<string>('');
  readonly busquedaPlanta = signal<string>('');

  // KPIs Generales
  readonly granTotalCabezas = computed(() => {
    return this.informeMunicipios().reduce((acc, curr) => acc + curr.cabezas, 0);
  });

  readonly granTotalBruto = computed(() => {
    return this.informeMunicipios().reduce((acc, curr) => acc + curr.valorBruto, 0);
  });

  readonly granTotalParticipacion10 = computed(() => {
    return this.informeMunicipios().reduce((acc, curr) => acc + curr.participacion10, 0);
  });

  readonly granTotalDepartamental = computed(() => {
    return this.informeMunicipios().reduce((acc, curr) => acc + curr.totalDepartamental, 0);
  });

  readonly totalFormularios = computed(() => {
    return this.informeMunicipios().reduce((acc, curr) => acc + curr.formularios, 0);
  });

  // Lista Filtrada Municipios
  readonly municipiosFiltrados = computed(() => {
    const q = this.busquedaMuni().toLowerCase().trim();
    if (!q) return this.informeMunicipios();
    return this.informeMunicipios().filter((m) => m.municipio.toLowerCase().includes(q));
  });

  // Lista Filtrada Plantas
  readonly plantasFiltradas = computed(() => {
    const q = this.busquedaPlanta().toLowerCase().trim();
    if (!q) return this.informePlantas();
    return this.informePlantas().filter(
      (p) => p.planta.toLowerCase().includes(q) || p.municipio.toLowerCase().includes(q)
    );
  });

  // Distribución por Estados de Cartera
  readonly estadisticasCartera = computed(() => {
    const total = this.listaDeclaraciones().length || 1;
    const pagados = this.listaDeclaraciones().filter((d) => d.estadoPago === 'PAGADO');
    const pendientes = this.listaDeclaraciones().filter((d) => d.estadoPago === 'PENDIENTE');
    const vencidos = this.listaDeclaraciones().filter((d) => d.estadoPago === 'VENCIDO');
    const corregidas = this.listaDeclaraciones().filter((d) => d.estadoPago === 'CORREGIDA');

    const sumaMonto = (arr: DeclaracionDeguelloData[]) => arr.reduce((acc, curr) => acc + curr.totalAPagar, 0);

    return [
      {
        estado: 'PAGADO',
        color: 'emerald',
        icon: 'fa-circle-check',
        cantidad: pagados.length,
        porcentaje: Math.round((pagados.length / total) * 100),
        monto: sumaMonto(pagados)
      },
      {
        estado: 'PENDIENTE',
        color: 'amber',
        icon: 'fa-clock',
        cantidad: pendientes.length,
        porcentaje: Math.round((pendientes.length / total) * 100),
        monto: sumaMonto(pendientes)
      },
      {
        estado: 'VENCIDO',
        color: 'rose',
        icon: 'fa-triangle-exclamation',
        cantidad: vencidos.length,
        porcentaje: Math.round((vencidos.length / total) * 100),
        monto: sumaMonto(vencidos)
      },
      {
        estado: 'CORREGIDA (RELIQUIDADA)',
        color: 'purple',
        icon: 'fa-arrows-rotate',
        cantidad: corregidas.length,
        porcentaje: Math.round((corregidas.length / total) * 100),
        monto: sumaMonto(corregidas)
      }
    ];
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.deguelloService.obtenerInformeMunicipios().subscribe((data) => {
      this.informeMunicipios.set(data);
    });

    this.deguelloService.obtenerInformePlantas().subscribe((plantas) => {
      this.informePlantas.set(plantas);
    });

    this.deguelloService.listarDeclaraciones().subscribe((decs) => {
      this.listaDeclaraciones.set(decs);
    });
  }

  cambiarTab(tab: 'municipios' | 'plantas' | 'cartera'): void {
    this.tabActivo.set(tab);
  }

  imprimir(): void {
    window.print();
  }

  exportarCsvMunicipios(): void {
    const headers = ['Municipio', 'N° Formularios', 'Cabezas Ganado Mayor', 'Valor Bruto Total ($ COP)', 'Participación 10% Municipal ($ COP)', 'Renta Departamental 90% ($ COP)'];
    const rows = this.informeMunicipios().map((m) => [
      `"${m.municipio}"`,
      m.formularios,
      m.cabezas,
      m.valorBruto,
      m.participacion10,
      m.totalDepartamental
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    this.descargarArchivo(csvContent, `informe_deguello_participacion_municipios_${this.vigenciaSeleccionada()}.csv`, 'text/csv;charset=utf-8;');
    this.toast.success('El archivo CSV de participación municipal se descargó con éxito.');
  }

  exportarCsvPlantas(): void {
    const headers = ['Planta de Beneficio Animal', 'Municipio Sede', 'Capacidad Diaria Cabezas', 'Cabezas Faenadas Mes', '% Ocupación', 'Recaudo Total ($ COP)'];
    const rows = this.informePlantas().map((p) => [
      `"${p.planta}"`,
      `"${p.municipio}"`,
      p.capacidadDiaria,
      p.cabezasFaenadas,
      `${p.porcentajeOcupacion}%`,
      p.recaudoTotal
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    this.descargarArchivo(csvContent, `informe_deguello_plantas_beneficio_${this.vigenciaSeleccionada()}.csv`, 'text/csv;charset=utf-8;');
    this.toast.success('El archivo CSV de frigoríficos y PBA se descargó con éxito.');
  }

  private descargarArchivo(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
