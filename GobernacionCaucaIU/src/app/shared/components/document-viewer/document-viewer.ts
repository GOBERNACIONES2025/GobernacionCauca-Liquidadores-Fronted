import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentItem } from './document-viewer.model';
import { AuthStateService } from '../../../core/auth/auth-state.service';

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      if (this.documentos && this.documentos.length > 0) {
        this.selectDocument(this.documentos[0]);
      } else {
        this.selectedDoc = null;
        this.safeUrl = null;
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

  selectDocument(doc: DocumentItem) {
    this.selectedDoc = doc;
    const url = this.buildUrl(doc.rutaArchivo);
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  close() {
    this.isOpen = false;
    this.selectedDoc = null;
    this.safeUrl = null;
    this.onClose.emit();
  }

  downloadCurrent() {
    if (!this.selectedDoc) return;
    
    const url = this.buildUrl(this.selectedDoc.rutaArchivo);

    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.download = this.selectedDoc.nombreArchivo || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
