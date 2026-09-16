import { Injectable } from '@angular/core';
import { generatePdfBlobFromHtml } from '../../../../shared/utils/pdf-exporter.util';
import { DatosLiquidacionDemo, LiquidacionPasaporteDemo } from '../../domain/models/liquidacion-pasaporte-demo.model';

export const VALOR_LIQUIDACION_DEMO = 250000;

@Injectable({ providedIn: 'root' })
export class LiquidacionPasaporteDemoService {
  crearLiquidacion(datos: DatosLiquidacionDemo): LiquidacionPasaporteDemo {
    return {
      consecutivoCita: datos.consecutivo,
      referenciaPago: `PSP${String(datos.consecutivo).padStart(8, '0')}`,
      fechaGeneracion: new Date().toLocaleDateString('es-CO'),
      tipoPasaporte: datos.tipoPasaporte.nombre,
      codigoTipoPasaporte: datos.tipoPasaporte.codigo,
      ciudadano: datos.ciudadano,
      documento: datos.documento,
      fechaCita: this.formatearFecha(datos.fechaCita),
      horario: datos.horario,
      concepto: 'Primera instancia del trámite de pasaporte',
      valor: VALOR_LIQUIDACION_DEMO,
      estado: 'SIMULACIÓN',
    };
  }

  async generarPdf(liquidacion: LiquidacionPasaporteDemo): Promise<Blob> {
    return generatePdfBlobFromHtml(this.construirHtmlPdf(liquidacion));
  }

  codigoBarrasSvg(referencia: string): string {
    const barras = Array.from(referencia).flatMap((caracter) => {
      const bits = caracter.charCodeAt(0).toString(2).padStart(8, '0');
      return [true, false, ...Array.from(bits, (bit) => bit === '1'), false];
    });
    const rects = barras.map((barra, indice) => barra
      ? `<rect x="${indice * 2}" y="0" width="1.2" height="54"/>`
      : '').join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${barras.length * 2} 54" role="img" aria-label="Código de barras de demostración"><rect width="100%" height="100%" fill="white"/>${rects}</svg>`;
  }

  private construirHtmlPdf(liquidacion: LiquidacionPasaporteDemo): string {
    const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] ?? char));
    const valor = liquidacion.valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    return `<!doctype html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#1e293b;background:#fff}#pageContainer{width:760px;padding:42px;background:#fff}.header{border-bottom:4px solid #1b53ad;padding-bottom:20px}.institution{font-size:22px;font-weight:700;color:#1b53ad}.module{font-size:13px;color:#64748b;margin-top:5px}.title{font-size:25px;font-weight:700;margin:30px 0 8px}.badge{display:inline-block;background:#fef3c7;color:#92400e;font-weight:700;padding:6px 12px;border-radius:4px;font-size:12px}.notice{margin:20px 0;padding:12px;background:#eff6ff;color:#1e40af;font-size:12px;font-weight:700;text-align:center}.section{border:1px solid #cbd5e1;border-radius:8px;padding:18px;margin-top:18px}.section h2{font-size:14px;color:#1b53ad;margin:0 0 14px}.row{display:flex;margin:8px 0;font-size:13px}.label{width:210px;color:#64748b}.value{font-weight:700}.barcode{margin:30px auto 8px;width:440px;height:90px}.barcode svg{width:100%;height:100%}.barcode-label{text-align:center;font-size:11px;color:#64748b}.footer{border-top:1px solid #cbd5e1;margin-top:35px;padding-top:14px;font-size:11px;color:#64748b;text-align:center}
    </style></head><body><main id="pageContainer"><header class="header"><div class="institution">Gobernación del Cauca</div><div class="module">Módulo de Pasaportes</div><div class="title">LIQUIDACIÓN DE PASAPORTE</div><span class="badge">SIMULACIÓN</span></header><div class="notice">DOCUMENTO DE DEMOSTRACIÓN - NO VÁLIDO PARA PAGO</div><section class="section"><h2>Datos del ciudadano</h2><div class="row"><span class="label">Nombre completo</span><span class="value">${esc(liquidacion.ciudadano)}</span></div><div class="row"><span class="label">Documento</span><span class="value">${esc(liquidacion.documento)}</span></div></section><section class="section"><h2>Datos del trámite</h2><div class="row"><span class="label">Tipo de pasaporte</span><span class="value">${esc(liquidacion.tipoPasaporte)} (${esc(liquidacion.codigoTipoPasaporte)})</span></div><div class="row"><span class="label">Fecha de cita</span><span class="value">${esc(liquidacion.fechaCita)}</span></div><div class="row"><span class="label">Horario</span><span class="value">${esc(liquidacion.horario)}</span></div></section><section class="section"><h2>Datos de liquidación</h2><div class="row"><span class="label">Consecutivo de cita</span><span class="value">${liquidacion.consecutivoCita}</span></div><div class="row"><span class="label">Referencia de pago DEMO</span><span class="value">${esc(liquidacion.referenciaPago)}</span></div><div class="row"><span class="label">Concepto</span><span class="value">${esc(liquidacion.concepto)}</span></div><div class="row"><span class="label">Valor simulado</span><span class="value">${valor}</span></div><div class="row"><span class="label">Fecha de generación</span><span class="value">${esc(liquidacion.fechaGeneracion)}</span></div></section><div class="barcode">${this.codigoBarrasSvg(liquidacion.referenciaPago)}</div><div class="barcode-label">Código de barras de demostración · ${esc(liquidacion.referenciaPago)}</div><footer class="footer">DOCUMENTO DE DEMOSTRACIÓN - NO VÁLIDO PARA PAGO</footer></main></body></html>`;
  }

  private formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.slice(0, 10).split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
  }
}
