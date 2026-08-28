import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentItem } from './document-viewer.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { downloadPdfFromHtml } from '../../utils/pdf-exporter.util';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-viewer.html',
  styleUrls: ['./document-viewer.css']
})
export class DocumentViewerComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() title = 'Visor de Documentos';
  @Input() documentos: DocumentItem[] = [];
  @Output() onClose = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);
  private authState = inject(AuthStateService);
  
  selectedDoc: DocumentItem | null = null;
  safeUrl: SafeResourceUrl | null = null;
  htmlDocContent: string | null = null;
  safeSrcdoc: SafeHtml | null = null;
  zoomLevel: number = 100;
  isDownloading: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.zoomLevel = 100;
      this.isDownloading = false;
      if (this.documentos && this.documentos.length > 0) {
        this.selectDocument(this.documentos[0]);
      } else {
        this.selectedDoc = null;
        this.safeUrl = null;
        this.htmlDocContent = null;
        this.safeSrcdoc = null;
      }
    }
  }

  private buildUrl(ruta: string): string {
    if (ruta.startsWith('http')) return ruta;
    const apiUrl = this.authState.getApiUrl('REGISTROS') || '';
    const cleanApi = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const cleanRuta = ruta.startsWith('/') ? ruta : `/${ruta}`;
    return `${cleanApi}${cleanRuta}`;
  }

  async selectDocument(doc: DocumentItem) {
    this.selectedDoc = doc;
    this.htmlDocContent = doc.contenidoHtml || null;
    this.safeUrl = null;
    this.safeSrcdoc = null;
    this.zoomLevel = 100;
    this.isDownloading = false;

    if (this.htmlDocContent) {
      this.safeSrcdoc = this.sanitizer.bypassSecurityTrustHtml(this.htmlDocContent);
      return;
    }

    if (doc.rutaArchivo?.startsWith('blob:')) {
      try {
        const response = await fetch(doc.rutaArchivo);
        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html') || text.includes('<div') || text.includes('<table')) {
          this.htmlDocContent = text;
          this.safeSrcdoc = this.sanitizer.bypassSecurityTrustHtml(text);
          return;
        }
      } catch (e) {
        console.error('Error al inspeccionar contenido del documento:', e);
      }
    }

    const url = this.buildUrl(doc.rutaArchivo);
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  close() {
    this.isOpen = false;
    this.selectedDoc = null;
    this.safeUrl = null;
    this.htmlDocContent = null;
    this.safeSrcdoc = null;
    this.zoomLevel = 100;
    this.isDownloading = false;
    this.onClose.emit();
  }

  zoomIn() {
    this.zoomLevel = Math.min(200, this.zoomLevel + 15);
  }

  zoomOut() {
    this.zoomLevel = Math.max(50, this.zoomLevel - 15);
  }

  resetZoom() {
    this.zoomLevel = 100;
  }

  openInNewTab() {
    if (this.htmlDocContent) {
      const tab = window.open('', '_blank');
      if (tab) {
        tab.document.write(this.htmlDocContent);
        tab.document.close();
      }
    } else if (this.selectedDoc?.rutaArchivo) {
      window.open(this.buildUrl(this.selectedDoc.rutaArchivo), '_blank');
    }
  }

  printCurrent() {
    if (this.htmlDocContent) {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(this.htmlDocContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          printWin.print();
        }, 350);
      }
    } else if (this.selectedDoc?.rutaArchivo) {
      window.open(this.buildUrl(this.selectedDoc.rutaArchivo), '_blank');
    }
  }

  async downloadCurrent() {
    if (!this.selectedDoc || this.isDownloading) return;
    
    const filename = this.selectedDoc.nombreArchivo || 'Recibo_Liquidacion.pdf';
    this.isDownloading = true;

    try {
      if (this.htmlDocContent) {
        await downloadPdfFromHtml(this.htmlDocContent, filename);
        return;
      }

      const url = this.buildUrl(this.selectedDoc.rutaArchivo);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Error al descargar el documento:', e);
    } finally {
      this.isDownloading = false;
    }
  }
}
