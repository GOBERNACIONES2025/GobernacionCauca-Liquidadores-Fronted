import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LiquidacionesOficialesFacade } from '../../../application/facades/liquidaciones-oficiales.facade';
import {
  ActoLiquidacionOficial,
  ActoLiquidacionOficialDetalle,
  TabLiquidacionOficial,
  ActualizarTrazabilidadPostalLiqOficialRequest,
} from '../../../domain/models/liquidacion-oficial.model';

@Component({
  selector: 'app-liquidaciones-oficiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liquidaciones-oficiales.html',
})
export class LiquidacionesOficialesPage implements OnInit {
  readonly facade = inject(LiquidacionesOficialesFacade);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);

  // Filtros de búsqueda
  textoBuscar = '';

  // Formulario local del Modal de Trazabilidad Postal (4-72)
  formNumeroGuia = '';
  formEmpresaEnvio = 'Servicios Postales Nacionales 4-72';
  formFechaEnvio = new Date().toISOString().split('T')[0];
  formFechaEntrega = '';
  formEstadoPostal = 'ENTREGADO';
  formObservacionesPostal = '';

  // Formulario local del Modal de Emisión de Aforo Individual
  formResponsableEmision = 'SUBDIRECCIÓN DE FISCALIZACIÓN Y COBRO';
  formObservacionesEmision = '';

  // Formulario local del Modal de Emisión Masiva
  formResponsableMasivo = 'DIRECCIÓN DE GESTIÓN TRIBUTARIA DEPARTAMENTAL';
  formVigenciaMasiva = 0;

  // Formulario local del Modal de Pérdida de Competencia / Prescripción
  formMotivoPrescripcion = 'Pérdida de competencia por término quinquenal extintivo (ETN Arts. 717 y 817)';
  formFundamentoNormativo = 'Artículo 817 del Estatuto Tributario Nacional y Ordenanza Fiscal Departamental del Cauca.';
  formResponsablePrescripcion = 'SUBDIRECCIÓN DE RENTAS Y COBRO COACTIVO';

  readonly aniosDisponibles = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

  ngOnInit(): void {
    const placaParam = this.route.snapshot.queryParamMap.get('placa');
    if (placaParam) {
      this.textoBuscar = placaParam.toUpperCase();
      this.facade.buscar.set(this.textoBuscar);
    }
    this.facade.cargarActos();
    this.facade.cargarKpis();
  }

  onSelectTab(tab: TabLiquidacionOficial): void {
    this.facade.cambiarTab(tab);
  }

  onBuscar(): void {
    this.facade.buscar.set(this.textoBuscar);
    this.facade.aplicarFiltros();
  }

  onBuscarKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.onBuscar();
  }

  onFiltroVigencia(event: Event): void {
    const val = +(event.target as HTMLSelectElement).value;
    this.facade.vigenciaFiltro.set(val);
    this.facade.aplicarFiltros();
  }

  onLimpiarFiltros(): void {
    this.textoBuscar = '';
    this.facade.limpiarFiltros();
  }

  onVerificarEjecutoria(): void {
    this.facade.verificarEjecutoria();
  }

  // ── Emisión Individual ─────────────────────────────────────────────────────
  abrirModalEmitir(acto: ActoLiquidacionOficial): void {
    this.formResponsableEmision = 'SUBDIRECCIÓN DE FISCALIZACIÓN Y COBRO';
    this.formObservacionesEmision = `Liquidación Oficial de Aforo expedida ante el vencimiento del plazo legal del Emplazamiento Previo ${acto.numeroActoEmplazamiento || ''}.`;
    this.facade.abrirEmitirAforo(acto);
  }

  confirmarEmitir(): void {
    this.facade.confirmarEmitirAforo(this.formResponsableEmision, this.formObservacionesEmision);
  }

  cerrarModalEmitir(): void {
    this.facade.cerrarEmitirAforo();
  }

  // ── Emisión Masiva ────────────────────────────────────────────────────────
  abrirModalEmitirMasivo(): void {
    this.formResponsableMasivo = 'DIRECCIÓN DE GESTIÓN TRIBUTARIA DEPARTAMENTAL';
    this.formVigenciaMasiva = 0;
    this.facade.abrirEmitirMasivo();
  }

  confirmarEmitirMasivo(): void {
    this.facade.vigenciaMasivaSeleccionada.set(this.formVigenciaMasiva);
    this.facade.confirmarEmitirMasivo(this.formResponsableMasivo);
  }

  cerrarModalEmitirMasivo(): void {
    this.facade.cerrarEmitirMasivo();
  }

  // ── Trazabilidad Postal ───────────────────────────────────────────────────
  abrirModalPostal(acto: ActoLiquidacionOficial): void {
    this.formNumeroGuia = acto.numeroGuiaPostal || '';
    this.formEmpresaEnvio = acto.empresaEnvio || 'Servicios Postales Nacionales 4-72';
    this.formFechaEnvio = acto.fechaEnvioPostal || new Date().toISOString().split('T')[0];
    this.formFechaEntrega = acto.fechaEntregaNotificacion || '';
    this.formEstadoPostal = acto.estadoPostal || 'ENTREGADO';
    this.formObservacionesPostal = acto.observacionesPostal || '';
    this.facade.abrirPostal(acto);
  }

  guardarPostal(): void {
    const acto = this.facade.actoPostalActivo();
    if (!acto) return;

    const payload: ActualizarTrazabilidadPostalLiqOficialRequest = {
      actoLiquidacionOficialId: acto.id,
      numeroGuiaPostal: this.formNumeroGuia.trim(),
      empresaEnvio: this.formEmpresaEnvio.trim(),
      fechaEnvioPostal: this.formFechaEnvio || undefined,
      fechaEntregaNotificacion: this.formFechaEntrega || undefined,
      estadoPostal: this.formEstadoPostal,
      observacionesPostal: this.formObservacionesPostal.trim(),
    };

    this.facade.guardarPostal(payload);
  }

  cerrarModalPostal(): void {
    this.facade.cerrarPostal();
  }

  // ── Pérdida de Competencia / Prescripción ──────────────────────────────────
  abrirModalPrescribir(acto: ActoLiquidacionOficial): void {
    this.formMotivoPrescripcion = 'Pérdida de competencia por término quinquenal extintivo (ETN Arts. 717 y 817)';
    this.formFundamentoNormativo = 'Artículo 817 del Estatuto Tributario Nacional y Ordenanza Fiscal Departamental del Cauca.';
    this.formResponsablePrescripcion = 'SUBDIRECCIÓN DE RENTAS Y COBRO COACTIVO';
    this.facade.abrirPrescribir(acto);
  }

  confirmarPrescribir(): void {
    this.facade.confirmarPrescribir(
      this.formMotivoPrescripcion,
      this.formFundamentoNormativo,
      this.formResponsablePrescripcion
    );
  }

  cerrarModalPrescribir(): void {
    this.facade.cerrarPrescribir();
  }

  // ── Descarga de PDF y Visualización ────────────────────────────────────────
  descargarResolucionPdf(acto: ActoLiquidacionOficial): void {
    this.facade.descargarResolucionPdf(acto.id, acto.numeroActo);
  }

  descargarPrescripcionPdf(acto: ActoLiquidacionOficial): void {
    this.facade.descargarPrescripcionPdf(acto.id, acto.numeroResolucionPrescripcion || undefined);
  }

  abrirPreviewHtml(acto: ActoLiquidacionOficial): void {
    const titulo = `Resolución de Liquidación Oficial de Aforo - Acto ${acto.numeroActo} (Placa: ${acto.placa})`;
    if (acto.id > 0) {
      this.facade.abrirPreviewHtml(acto.id, titulo);
    } else {
      // Generar vista previa del proyecto de resolución de aforo (Borrador Pre-expedición)
      const borradorHtml = this.generarBorradorResolucionAforoHtml(acto);
      this.facade.previewTitulo.set(titulo + ' - [PROYECTO BORRADOR]');
      this.facade.previewHtml.set(borradorHtml);
      this.facade.loadingPreview.set(false);
      this.facade.isModalPreviewOpen.set(true);
    }
  }

  private generarBorradorResolucionAforoHtml(acto: ActoLiquidacionOficial): string {
    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const fmt = (v?: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

    return `
      <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 15px; text-transform: uppercase; color: #0f172a; font-weight: 800;">República de Colombia</h2>
          <h3 style="margin: 2px 0; font-size: 13px; text-transform: uppercase; color: #334155;">Departamento del Cauca · Secretaría de Hacienda</h3>
          <h4 style="margin: 2px 0; font-size: 11px; text-transform: uppercase; color: #64748b;">Subdirección de Gestión de Rentas y Fiscalización Tributaria</h4>
          <div style="margin-top: 10px; display: inline-block; background: #fef3c7; border: 1px solid #f59e0b; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; color: #92400e;">
            PROYECTO DE RESOLUCIÓN DE LIQUIDACIÓN OFICIAL DE AFORO (ETN ART. 717)
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 11.5px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 0; width: 35%;"><strong>EXPEDIENTE / PLACA:</strong></td>
              <td style="padding: 3px 0; font-family: monospace; font-size: 13px; font-weight: bold; color: #1e3a8a;">${acto.placa}</td>
              <td style="padding: 3px 0; width: 25%;"><strong>FECHA PROYECCIÓN:</strong></td>
              <td style="padding: 3px 0;">${fechaHoy}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0;"><strong>CONTRIBUYENTE / PROPIETARIO:</strong></td>
              <td style="padding: 3px 0;">${acto.propietarioNombre || 'NO REGISTRADO'}</td>
              <td style="padding: 3px 0;"><strong>IDENTIFICACIÓN:</strong></td>
              <td style="padding: 3px 0;">${acto.propietarioIdentificacion || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0;"><strong>VIGENCIAS DETERMINADAS:</strong></td>
              <td style="padding: 3px 0;" colspan="3"><strong>${acto.vigencias || '2026'}</strong></td>
            </tr>
          </table>
        </div>

        <div style="font-size: 11.5px; text-align: justify; margin-bottom: 16px;">
          <p><strong>EL SUBDIRECTOR DE INGRESOS Y GESTIÓN TRIBUTARIA DEL DEPARTAMENTO DEL CAUCA,</strong> en uso de sus facultades legales y estatutarias, en especial las conferidas por la Ley 488 de 1998, los Artículos 715, 717 y 643 del Estatuto Tributario Nacional (ETN), y</p>
          <p style="margin-top: 8px;"><strong>CONSIDERANDO:</strong></p>
          <ol style="padding-left: 20px; margin-top: 6px;">
            <li style="margin-bottom: 6px;">Que verificado el Registro de Vehículos Automotores del Departamento del Cauca, el automotor de placas <strong>${acto.placa}</strong> se encuentra en estado de omisión respecto al Impuesto sobre Vehículos Automotores.</li>
            <li style="margin-bottom: 6px;">Que la Administración Tributaria Departamental notificó formalmente el <strong>Acto de Emplazamiento Previo para Declarar</strong> otorgando el término legal de un (1) mes calendario previsto en el Artículo 715 del ETN.</li>
            <li style="margin-bottom: 6px;">Que vencido en exceso el término legal de respuesta y traslado sin que el contribuyente hubiere presentado su declaración privada ni acreditado el pago, opera de pleno derecho la competencia para practicar <strong>LIQUIDACIÓN OFICIAL DE AFORO</strong> conforme al Artículo 717 del ETN, imponiendo la <strong>Sanción por no declarar del 160%</strong> regulada en el Artículo 643 del citado estatuto.</li>
          </ol>
        </div>

        <h4 style="font-size: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase;">
          Determinación Oficial de la Deuda Tributaria y Sanción de Aforo
        </h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: white;">
              <th style="padding: 6px 10px; text-align: left;">CONCEPTO DETERMINADO</th>
              <th style="padding: 6px 10px; text-align: right;">VALOR LIQUIDADO</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 10px;">Impuesto sobre Vehículos Automotores (Base Gravable Oficial)</td>
              <td style="padding: 6px 10px; text-align: right; font-weight: bold;">${fmt(acto.impuestoBase)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #fffbeb;">
              <td style="padding: 6px 10px; color: #b45309;">
                <strong>Sanción por No Declarar (160% - ETN Art. 643)</strong>
                <div style="font-size: 10px; color: #78350f;">Cálculo oficial del 160% sobre el impuesto determinado</div>
              </td>
              <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: #b45309;">${fmt(acto.sancionNoDeclarar)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 6px 10px;">Intereses Moratorios Proyectados a la Fecha</td>
              <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: #b91c1c;">${fmt(acto.interesesMora)}</td>
            </tr>
            <tr style="background: #f1f5f9; font-size: 12.5px;">
              <td style="padding: 8px 10px; font-weight: bold; text-transform: uppercase;">TOTAL LIQUIDACIÓN OFICIAL DE AFORO:</td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 900; color: #0f172a;">${fmt(acto.totalLiquidacionOficial)}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-size: 11px; text-align: justify; margin-bottom: 24px;">
          <p><strong>NOTIFÍQUESE Y CÚMPLASE.</strong> Contra la presente Liquidación Oficial de Aforo procede el <strong>Recurso de Reconsideración</strong> ante la Subdirección de Ingresos dentro de los dos (2) meses siguientes a su notificación, de conformidad con el Artículo 720 del Estatuto Tributario Nacional.</p>
        </div>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px;">
          <div style="border-top: 1px solid #64748b; width: 45%; text-align: center; padding-top: 5px;">
            <strong>SUBDIRECTOR DE GESTIÓN TRIBUTARIA</strong><br/>
            Secretaría de Hacienda Departamental del Cauca
          </div>
          <div style="border-top: 1px solid #64748b; width: 45%; text-align: center; padding-top: 5px;">
            <strong>REVISÓ Y VALIDÓ</strong><br/>
            Grupo de Cobro Coactivo y Fiscalización
          </div>
        </div>
      </div>
    `;
  }

  cerrarPreviewHtml(): void {
    this.facade.cerrarPreviewHtml();
  }

  imprimirPreviewHtml(): void {
    this.facade.imprimirPreviewHtml();
  }

  // ── Acordeón y Selección ──────────────────────────────────────────────────
  toggleDetalle(id: number): void {
    this.facade.toggleDetalle(id);
  }

  isDetalleExpandido(id: number): boolean {
    return this.facade.isDetalleExpandido(id);
  }

  toggleSeleccion(placa: string, id: number): void {
    this.facade.toggleSeleccion(placa, id);
  }

  isSeleccionado(placa: string): boolean {
    return this.facade.isSeleccionado(placa);
  }

  seleccionarTodos(): void {
    this.facade.seleccionarTodos();
  }

  paginaAnterior(): void {
    const p = this.facade.page();
    if (p > 1) this.facade.cambiarPagina(p - 1);
  }

  paginaSiguiente(): void {
    const p = this.facade.page();
    const total = this.facade.totalPages();
    if (p < total) this.facade.cambiarPagina(p + 1);
  }

  getSafeHtml(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html || '');
  }

  // ── Helpers Visuales y Etiquetas ──────────────────────────────────────────
  estadoActoBadge(estado: string): string {
    switch (estado) {
      case 'BORRADOR':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'EMITIDO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'NOTIFICADO':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EN_RECURSO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EJECUTORIADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
      case 'PRESCRITO':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  estadoActoLabel(estado: string): string {
    switch (estado) {
      case 'BORRADOR': return 'Borrador';
      case 'EMITIDO': return 'Emitido';
      case 'NOTIFICADO': return 'Notificado (En Términos)';
      case 'EN_RECURSO': return 'En Vía Gubernativa';
      case 'EJECUTORIADO': return 'Título en Firme';
      case 'PRESCRITO': return 'Pérdida Competencia';
      default: return estado;
    }
  }

  estadoPostalBadge(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_ENVIO': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'EN_TRANSITO': return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'ENTREGADO': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'DEVUELTO': return 'bg-rose-50 text-rose-800 border-rose-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  estadoPostalLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE_ENVIO': return 'Pendiente Envío';
      case 'EN_TRANSITO': return 'En Tránsito 4-72';
      case 'ENTREGADO': return 'Entregado / Notificado';
      case 'DEVUELTO': return 'Devuelto';
      default: return estado || 'Sin Notificar';
    }
  }

  vigenciasStr(vigencias: number[] | string): string {
    if (!vigencias) return '—';
    if (Array.isArray(vigencias)) {
      return vigencias.slice().sort((a, b) => a - b).join(', ');
    }
    return vigencias;
  }
}
