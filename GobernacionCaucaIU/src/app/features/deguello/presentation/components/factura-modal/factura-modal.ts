import { Component, Input, Output, EventEmitter, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DeclaracionDeguelloData } from '../../../domain/models/deguello.model';
import { DeguelloService } from '../../../infrastructure/services/deguello.service';

@Component({
  selector: 'app-factura-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-modal.html',
})
export class FacturaModalComponent implements AfterViewInit {
  private deguelloService = inject(DeguelloService);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) declaracion!: DeclaracionDeguelloData;
  @Output() cerrar = new EventEmitter<void>();

  @ViewChild('printFrame') printFrame?: ElementRef<HTMLIFrameElement>;

  readonly htmlContent = computed<string>(() => {
    return this.deguelloService.renderizarHtmlFactura(this.declaracion);
  });

  ngAfterViewInit(): void {
    this.cargarIframe();
  }

  cargarIframe(): void {
    if (this.printFrame?.nativeElement) {
      const doc = this.printFrame.nativeElement.contentDocument || this.printFrame.nativeElement.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(this.htmlContent());
        doc.close();
      }
    }
  }

  imprimir(): void {
    if (this.printFrame?.nativeElement?.contentWindow) {
      this.printFrame.nativeElement.contentWindow.focus();
      this.printFrame.nativeElement.contentWindow.print();
    } else {
      window.print();
    }
  }
}
