import { Injectable, inject, signal, computed } from '@angular/core';
import { EstampillasStorageService } from '../../infrastructure/storage/storage.service';
import {
  RecaudoPorEstampilla,
  RecaudoMensual,
  RecaudoPorMunicipio,
  RecaudoPorVigencia,
  TopContribuyente
} from '../../domain/models/estampillas.models';

@Injectable({
  providedIn: 'root'
})
export class ReportesFacade {
  private storage = inject(EstampillasStorageService);

  readonly filtroVigencia = signal<number>(2026);
  readonly filtroMunicipio = signal<string>('TODOS');
  readonly filtroEstampilla = signal<string>('TODOS');

  setFiltroVigencia(vig: number): void {
    this.filtroVigencia.set(vig);
  }

  setFiltroMunicipio(mun: string): void {
    this.filtroMunicipio.set(mun);
  }

  setFiltroEstampilla(est: string): void {
    this.filtroEstampilla.set(est);
  }

  readonly recaudoPorEstampilla = computed<RecaudoPorEstampilla[]>(() => {
    this.storage.dataVersion();
    const estampillas = this.storage.getEstampillas();
    const liquidaciones = this.storage.getLiquidaciones().filter(l => l.estado === 'PAGADA');
    const vig = this.filtroVigencia();

    const colores = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

    const totalGeneral = liquidaciones
      .filter(l => vig === 0 || l.vigencia === vig)
      .reduce((sum, l) => sum + l.totalPagar, 0) || 1;

    return estampillas.map((est, idx) => {
      let totalEstampilla = 0;
      let countLiqs = 0;

      for (const liq of liquidaciones) {
        if (vig > 0 && liq.vigencia !== vig) continue;
        for (const c of liq.conceptos) {
          if (c.estampillaId === est.id || c.estampillaCodigo === est.codigo) {
            totalEstampilla += c.valorImpuesto;
            countLiqs++;
          }
        }
      }

      const pct = Math.round((totalEstampilla / totalGeneral) * 100);

      return {
        estampillaId: est.id,
        estampillaNombre: est.nombre,
        estampillaCodigo: est.codigo,
        totalRecaudado: totalEstampilla,
        totalLiquidaciones: countLiqs,
        porcentajeParticipacion: pct,
        colorHex: colores[idx % colores.length]
      };
    });
  });

  readonly recaudoMensual = computed<RecaudoMensual[]>(() => {
    this.storage.dataVersion();
    const liquidaciones = this.storage.getLiquidaciones();
    const pagos = this.storage.getPagos();
    const vig = this.filtroVigencia();

    const meses = [
      { num: 1, nombre: 'Enero', corto: 'Ene' },
      { num: 2, nombre: 'Febrero', corto: 'Feb' },
      { num: 3, nombre: 'Marzo', corto: 'Mar' },
      { num: 4, nombre: 'Abril', corto: 'Abr' },
      { num: 5, nombre: 'Mayo', corto: 'May' },
      { num: 6, nombre: 'Junio', corto: 'Jun' },
      { num: 7, nombre: 'Julio', corto: 'Jul' },
      { num: 8, nombre: 'Agosto', corto: 'Ago' },
      { num: 9, nombre: 'Septiembre', corto: 'Sep' },
      { num: 10, nombre: 'Octubre', corto: 'Oct' },
      { num: 11, nombre: 'Noviembre', corto: 'Nov' },
      { num: 12, nombre: 'Diciembre', corto: 'Dic' }
    ];

    return meses.map(m => {
      const mesPrefix = `${vig > 0 ? vig : 2026}-${m.num.toString().padStart(2, '0')}`;

      const valorLiq = liquidaciones
        .filter(l => l.fechaGeneracion.startsWith(mesPrefix))
        .reduce((sum, l) => sum + l.totalPagar, 0);

      const valorRec = pagos
        .filter(p => p.fechaPago.startsWith(mesPrefix))
        .reduce((sum, p) => sum + p.valorPagado, 0);

      return {
        mes: m.nombre,
        mesCorto: m.corto,
        mesNumero: m.num,
        valorLiquidado: valorLiq,
        valorRecaudado: valorRec
      };
    });
  });

  readonly recaudoPorMunicipio = computed<RecaudoPorMunicipio[]>(() => {
    this.storage.dataVersion();
    const municipios = this.storage.getMunicipios();
    const liquidaciones = this.storage.getLiquidaciones().filter(l => l.estado === 'PAGADA');

    return municipios.map(mun => {
      const liqsMun = liquidaciones.filter(l => 
        (l.contribuyenteMunicipio && l.contribuyenteMunicipio.toLowerCase().includes(mun.nombre.toLowerCase())) ||
        (l.municipioEjecucion && l.municipioEjecucion.toLowerCase().includes(mun.nombre.toLowerCase()))
      );

      const total = liqsMun.reduce((sum, l) => sum + l.totalPagar, 0);

      return {
        municipioNombre: mun.nombre,
        totalLiquidaciones: liqsMun.length,
        totalRecaudado: total
      };
    }).sort((a, b) => b.totalRecaudado - a.totalRecaudado);
  });

  readonly recaudoPorVigencia = computed<RecaudoPorVigencia[]>(() => {
    this.storage.dataVersion();
    const vigencias = this.storage.getVigencias();
    const liquidaciones = this.storage.getLiquidaciones();
    const pagos = this.storage.getPagos();

    return vigencias.map(v => {
      const liqsVig = liquidaciones.filter(l => l.vigencia === v.anio);
      const totLiq = liqsVig.reduce((sum, l) => sum + l.totalPagar, 0);
      const totPag = liqsVig.filter(l => l.estado === 'PAGADA').reduce((sum, l) => sum + l.totalPagar, 0);

      return {
        vigencia: v.anio,
        totalLiquidado: totLiq,
        totalRecaudado: totPag,
        pendientes: Math.max(0, totLiq - totPag)
      };
    });
  });

  readonly topContribuyentes = computed<TopContribuyente[]>(() => {
    this.storage.dataVersion();
    const contribuyentes = this.storage.getContribuyentes();
    const contratos = this.storage.getContratos();
    const liquidaciones = this.storage.getLiquidaciones();
    const pagos = this.storage.getPagos();

    return contribuyentes.map(c => {
      const cts = contratos.filter(ct => ct.contribuyenteId === c.id);
      const liqs = liquidaciones.filter(l => l.contribuyenteId === c.id);
      const pgs = pagos.filter(p => p.contribuyenteId === c.id);

      const totLiq = liqs.reduce((sum, l) => sum + l.totalPagar, 0);
      const totPag = pgs.reduce((sum, p) => sum + p.valorPagado, 0);

      return {
        id: c.id,
        nombre: c.nombreCompleto,
        documento: c.numeroDocumento,
        municipio: c.municipioNombre,
        totalContratos: cts.length,
        totalLiquidado: totLiq,
        totalPagado: totPag
      };
    }).sort((a, b) => b.totalLiquidado - a.totalLiquidado).slice(0, 10);
  });
}
