import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { DatosLiquidacionDemo, LiquidacionPasaporteDemo } from '../../domain/models/liquidacion-pasaporte-demo.model';

const LOGO_URL = '/Logo_gov_cauca.png';

type PdfColor = [number, number, number];

@Injectable({ providedIn: 'root' })
export class LiquidacionPasaporteDemoService {
  crearLiquidacion(datos: DatosLiquidacionDemo): LiquidacionPasaporteDemo {
    const valorPagado = datos.pagoAprobado ? datos.primerPago : 0;
    const saldoPendiente = datos.pagoAprobado ? datos.saldoPendiente : datos.totalLiquidado;

    return {
      consecutivoCita: datos.consecutivo,
      referenciaPago: datos.referenciaPago,
      fechaGeneracion: new Date().toLocaleDateString('es-CO'),
      tipoPasaporte: datos.tipoPasaporte.nombre,
      codigoTipoPasaporte: datos.tipoPasaporte.codigo,
      ciudadano: datos.ciudadano,
      documento: datos.documento,
      fechaCita: this.formatearFecha(datos.fechaCita),
      horario: datos.horario,
      concepto: datos.pagoAprobado ? 'Primer pago aprobado (DEMO)' : 'Pago web no habilitado (DEMO)',
      valor: valorPagado,
      estado: 'SIMULACIÓN',
      pagoAprobado: datos.pagoAprobado,
      conceptos: datos.conceptos.map((concepto) => ({ ...concepto })),
      totalLiquidado: datos.totalLiquidado,
      valorPagado,
      saldoPendiente,
    };
  }

  /**
   * Generador exclusivo del módulo de Pasaportes.
   *
   * No usa el pdf-exporter compartido del proyecto y, por lo tanto, no modifica
   * ni depende de los estilos globales de Tailwind/DaisyUI. El PDF se dibuja
   * directamente con jsPDF para que su resultado sea determinista.
   */
  async generarPdf(liquidacion: LiquidacionPasaporteDemo): Promise<Blob> {
    const logo = await this.cargarImagenComoDataUrl(LOGO_URL);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    this.dibujarFactura(pdf, liquidacion, logo);

    const blob = pdf.output('blob');
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('El generador de la liquidación devolvió un PDF vacío.');
    }

    return blob;
  }

  private dibujarFactura(
    pdf: jsPDF,
    liquidacion: LiquidacionPasaporteDemo,
    logoDataUrl: string,
  ): void {
    const paginaAncho = 210;
    const margen = 10;
    const ancho = paginaAncho - margen * 2;

    const negro: PdfColor = [0, 0, 0];
    const grisCabecera: PdfColor = [223, 223, 223];
    const verdePago: PdfColor = [237, 247, 237];
    const beigeSaldo: PdfColor = [255, 247, 230];
    const naranjaDemo: PdfColor = [254, 243, 199];
    const naranjaTexto: PdfColor = [146, 64, 14];
    const grisFooter: PdfColor = [85, 85, 85];

    pdf.setDrawColor(...negro);
    pdf.setTextColor(...negro);
    pdf.setLineWidth(0.35);
    pdf.setFont('helvetica', 'normal');

    // ---------------- ENCABEZADO ----------------
    const headerY = 10;
    const headerH = 32;
    const logoW = 38;
    const statusW = 42;
    const institucionW = ancho - logoW - statusW;

    pdf.setLineWidth(0.7);
    pdf.rect(margen, headerY, ancho, headerH);
    pdf.line(margen + logoW, headerY, margen + logoW, headerY + headerH);
    pdf.line(
      margen + logoW + institucionW,
      headerY,
      margen + logoW + institucionW,
      headerY + headerH,
    );
    pdf.setLineWidth(0.35);

    try {
      pdf.addImage(logoDataUrl, 'PNG', margen + 4, headerY + 7, 30, 18, undefined, 'FAST');
    } catch (error) {
      console.warn('No fue posible incrustar el logo en el PDF de pasaportes.', error);
    }

    const institucionCentroX = margen + logoW + institucionW / 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('GOBERNACIÓN DEL CAUCA', institucionCentroX, headerY + 9, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text('NIT. —', institucionCentroX, headerY + 15, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.text('Liquidación de Impuesto de Pasaporte', institucionCentroX, headerY + 22, {
      align: 'center',
    });

    const statusX = margen + logoW + institucionW;
    const statusCentroX = statusX + statusW / 2;
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fecha liquidación', statusCentroX, headerY + 6.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(liquidacion.fechaGeneracion, statusCentroX, headerY + 11.5, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    const estadoPago = liquidacion.pagoAprobado
      ? 'PAGO INICIAL CONFIRMADO'
      : 'PAGO WEB NO HABILITADO';
    const estadoLineas = pdf.splitTextToSize(estadoPago, statusW - 6) as string[];
    pdf.text(estadoLineas, statusCentroX, headerY + 17, { align: 'center' });

    pdf.setFillColor(...naranjaDemo);
    pdf.setDrawColor(180, 83, 9);
    pdf.roundedRect(statusX + 7, headerY + 24, statusW - 14, 5.5, 1, 1, 'FD');
    pdf.setTextColor(...naranjaTexto);
    pdf.setFontSize(7.2);
    pdf.text('DEMO / SIMULACIÓN', statusCentroX, headerY + 27.7, { align: 'center' });
    pdf.setTextColor(...negro);
    pdf.setDrawColor(...negro);

    // ---------------- INFORMACIÓN GENERAL ----------------
    let y = headerY + headerH + 4;
    const infoH = 42;
    pdf.rect(margen, y, ancho, infoH);

    const col = ancho / 4;
    const rowH = 14;
    pdf.line(margen, y + rowH, margen + ancho, y + rowH);
    pdf.line(margen, y + rowH * 2, margen + ancho, y + rowH * 2);
    for (let i = 1; i < 4; i++) {
      pdf.line(margen + col * i, y, margen + col * i, y + rowH);
    }
    pdf.line(margen + col, y + rowH, margen + col, y + rowH * 2);
    pdf.line(margen + col, y + rowH * 2, margen + col, y + infoH);
    pdf.line(margen + col * 3, y + rowH * 2, margen + col * 3, y + infoH);

    const escribirCampo = (
      x: number,
      top: number,
      label: string,
      value: string,
      maxWidth: number,
      align: 'left' | 'right' = 'left',
    ): void => {
      const tx = align === 'right' ? x + maxWidth - 2.5 : x + 2.5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.text(label, tx, top + 4, { align });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.3);
      const lines = pdf.splitTextToSize(value || '—', maxWidth - 5) as string[];
      pdf.text(lines.slice(0, 2), tx, top + 9, { align });
    };

    escribirCampo(margen, y, 'Nro. liquidación', liquidacion.referenciaPago, col);
    escribirCampo(margen + col, y, 'Fecha de liquidación', liquidacion.fechaGeneracion, col);
    escribirCampo(margen + col * 2, y, 'Cod. impuesto', '—', col);
    escribirCampo(margen + col * 3, y, 'Impuesto sobre', 'Pasaporte', col);

    escribirCampo(margen, y + rowH, 'Documento', liquidacion.documento, col);
    escribirCampo(margen + col, y + rowH, 'Nombre', liquidacion.ciudadano, col * 3);

    escribirCampo(margen, y + rowH * 2, 'Periodo de liquidación', String(new Date().getFullYear()), col);
    escribirCampo(margen + col, y + rowH * 2, 'Tipo de pasaporte', liquidacion.tipoPasaporte, col * 2);
    escribirCampo(
      margen + col * 3,
      y + rowH * 2,
      'Valor base',
      `$ ${this.moneda(liquidacion.totalLiquidado)}`,
      col,
      'right',
    );

    // ---------------- CONCEPTOS ----------------
    y += infoH + 4;
    const conceptos = liquidacion.conceptos.length
      ? liquidacion.conceptos
      : [{ nombre: 'Sin conceptos para mostrar', valor: 0 }];
    const conceptHeaderH = 10;
    const conceptRowH = 10;
    const conceptH = conceptHeaderH + conceptos.length * conceptRowH;
    const conceptCols = [80, 35, 40, 35];

    pdf.rect(margen, y, ancho, conceptH);
    pdf.setFillColor(...grisCabecera);
    pdf.rect(margen, y, ancho, conceptHeaderH, 'F');
    pdf.rect(margen, y, ancho, conceptH);

    let cx = margen;
    for (let i = 0; i < conceptCols.length - 1; i++) {
      cx += conceptCols[i];
      pdf.line(cx, y, cx, y + conceptH);
    }
    pdf.line(margen, y + conceptHeaderH, margen + ancho, y + conceptHeaderH);
    for (let i = 1; i < conceptos.length; i++) {
      pdf.line(
        margen,
        y + conceptHeaderH + conceptRowH * i,
        margen + ancho,
        y + conceptHeaderH + conceptRowH * i,
      );
    }

    const headers = ['Concepto / Impuesto', 'Tarifa aplicada', 'Cant. / Vlr Base ($)', 'Total ($)'];
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.4);
    let headerX = margen;
    headers.forEach((header, index) => {
      pdf.text(header, headerX + conceptCols[index] / 2, y + 6.3, { align: 'center' });
      headerX += conceptCols[index];
    });

    pdf.setFontSize(8);
    conceptos.forEach((concepto, index) => {
      const rowY = y + conceptHeaderH + conceptRowH * index;
      pdf.setFont('helvetica', 'normal');
      const nombre = pdf.splitTextToSize(concepto.nombre, conceptCols[0] - 5) as string[];
      pdf.text(nombre.slice(0, 2), margen + 2.5, rowY + 6.2);
      pdf.text('Valor fijo', margen + conceptCols[0] + conceptCols[1] / 2, rowY + 6.2, {
        align: 'center',
      });
      pdf.text(
        this.moneda(concepto.valor),
        margen + conceptCols[0] + conceptCols[1] + conceptCols[2] - 2.5,
        rowY + 6.2,
        { align: 'right' },
      );
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.moneda(concepto.valor), margen + ancho - 2.5, rowY + 6.2, { align: 'right' });
    });

    // ---------------- RESUMEN Y CÓDIGO DE BARRAS ----------------
    y += conceptH + 4;
    const summaryRowH = 8;
    const summaryH = summaryRowH * 7;
    const barcodeW = 114;
    const resumenW = ancho - barcodeW;
    const labelW = 42;
    const currencyW = 10;
    const valueW = resumenW - labelW - currencyW;

    pdf.rect(margen, y, ancho, summaryH);
    pdf.line(margen + barcodeW, y, margen + barcodeW, y + summaryH);

    for (let i = 1; i < 7; i++) {
      pdf.line(margen + barcodeW, y + summaryRowH * i, margen + ancho, y + summaryRowH * i);
    }
    pdf.line(margen + barcodeW + labelW, y, margen + barcodeW + labelW, y + summaryH);
    pdf.line(
      margen + barcodeW + labelW + currencyW,
      y,
      margen + barcodeW + labelW + currencyW,
      y + summaryH,
    );

    pdf.setFillColor(...grisCabecera);
    pdf.rect(margen + barcodeW, y + summaryRowH * 4, resumenW, summaryRowH, 'F');
    pdf.setFillColor(...verdePago);
    pdf.rect(margen + barcodeW, y + summaryRowH * 5, resumenW, summaryRowH, 'F');
    pdf.setFillColor(...beigeSaldo);
    pdf.rect(margen + barcodeW, y + summaryRowH * 6, resumenW, summaryRowH, 'F');

    // Re-dibujar líneas del resumen después de los rellenos.
    pdf.rect(margen + barcodeW, y, resumenW, summaryH);
    for (let i = 1; i < 7; i++) {
      pdf.line(margen + barcodeW, y + summaryRowH * i, margen + ancho, y + summaryRowH * i);
    }
    pdf.line(margen + barcodeW + labelW, y, margen + barcodeW + labelW, y + summaryH);
    pdf.line(
      margen + barcodeW + labelW + currencyW,
      y,
      margen + barcodeW + labelW + currencyW,
      y + summaryH,
    );

    this.dibujarCodigoBarras(
      pdf,
      liquidacion.referenciaPago,
      margen + 10,
      y + 11,
      barcodeW - 20,
      25,
    );
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(8);
    pdf.text(liquidacion.referenciaPago, margen + barcodeW / 2, y + 42, { align: 'center' });

    const resumen = [
      ['Subtotal', liquidacion.totalLiquidado, false],
      ['Interés (+)', 0, false],
      ['Sanción (+)', 0, false],
      ['Descuento (-)', 0, false],
      ['Total liquidado', liquidacion.totalLiquidado, true],
      ['Valor pagado', liquidacion.valorPagado, true],
      ['Saldo pendiente', liquidacion.saldoPendiente, true],
    ] as const;

    resumen.forEach(([label, valor, bold], index) => {
      const rowY = y + summaryRowH * index;
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setFontSize(7.5);
      pdf.text(label, margen + barcodeW + 2.5, rowY + 5.3);
      pdf.setFont('helvetica', 'bold');
      pdf.text('$', margen + barcodeW + labelW + currencyW / 2, rowY + 5.3, {
        align: 'center',
      });
      pdf.text(
        this.moneda(valor),
        margen + barcodeW + labelW + currencyW + valueW - 2.5,
        rowY + 5.3,
        { align: 'right' },
      );
    });

    // ---------------- PIE ----------------
    y += summaryH + 7;
    pdf.setDrawColor(189, 189, 189);
    pdf.line(margen, y, margen + ancho, y);
    pdf.setTextColor(...grisFooter);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.3);
    pdf.text(`Referencia de pago: ${liquidacion.referenciaPago}`, paginaAncho / 2, y + 5, {
      align: 'center',
    });
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      'Documento generado por el módulo de Pasaportes de la Gobernación del Cauca.',
      paginaAncho / 2,
      y + 9.5,
      { align: 'center' },
    );
    pdf.setTextColor(...naranjaTexto);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOCUMENTO DE DEMOSTRACIÓN - NO VÁLIDO PARA PAGO', paginaAncho / 2, y + 14, {
      align: 'center',
    });
  }

  private dibujarCodigoBarras(
    pdf: jsPDF,
    referencia: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const barras = Array.from(referencia).flatMap((caracter) => {
      const bits = caracter.charCodeAt(0).toString(2).padStart(8, '0');
      return [true, false, ...Array.from(bits, (bit) => bit === '1'), false];
    });

    const unidad = width / barras.length;
    pdf.setFillColor(0, 0, 0);

    barras.forEach((barra, index) => {
      if (barra) {
        pdf.rect(x + index * unidad, y, Math.max(unidad * 0.62, 0.18), height, 'F');
      }
    });
  }

  private moneda(valor: number): string {
    return valor.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }

  private async cargarImagenComoDataUrl(url: string): Promise<string> {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`No fue posible cargar el logo institucional (${response.status}).`);
    }

    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No fue posible preparar el logo institucional.'));
      reader.readAsDataURL(blob);
    });
  }

  private formatearFecha(fecha: string): string {
    const [anio, mes, dia] = fecha.slice(0, 10).split('-');
    return anio && mes && dia ? `${dia}/${mes}/${anio}` : fecha;
  }
}
