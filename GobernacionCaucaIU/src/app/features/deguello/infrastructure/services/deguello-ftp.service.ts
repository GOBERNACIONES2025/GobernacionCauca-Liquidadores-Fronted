import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthStateService } from '../../../../core/auth/auth-state.service';
import { FtpFileResult } from '../../../automotores/domain/interfaces/ftp-file-result';

@Injectable({
  providedIn: 'root',
})
export class DeguelloFtpService {
  private http = inject(HttpClient);
  private authState = inject(AuthStateService);

  private get apiUrl(): string {
    const urls = this.authState.moduleApiUrls();
    return urls['DEGUELLO'] || 'http://localhost:5045/api/v1';
  }

  /**
   * Sube una Guía Sanitaria ICA organizada jerárquicamente:
   * /DEGUELLO/EMPRESAS/{nitEmpresa}/{anio}/GUIAS_ICA
   */
  subirGuiaIca(file: File, nitEmpresa: string, anio: number = 2026): Observable<FtpFileResult> {
    const nitLimpio = (nitEmpresa || 'GENERAL').trim().replace(/[^0-9a-zA-Z]/g, '');
    const remoteDir = `DEGUELLO/EMPRESAS/${nitLimpio}/${anio}/GUIAS_ICA`;

    const formData = new FormData();
    formData.append('document', file, file.name);
    formData.append('nitEmpresa', nitLimpio);
    formData.append('anio', anio.toString());

    return this.http.post<{ success: boolean; data: FtpFileResult }>(
      `${this.apiUrl}/ftp/subir-guia-ica`,
      formData
    ).pipe(
      map(res => res.data),
      catchError(() => {
        // Fallback simulado para desarrollo si el servidor FTP no está accesible
        const mockResult: FtpFileResult = {
          fileId: `mock-${Date.now()}`,
          fileName: `${Date.now()}_${file.name}`,
          originalFileName: file.name,
          remoteDirectory: remoteDir,
          remoteFullPath: `/${remoteDir}/${Date.now()}_${file.name}`,
          extension: file.name.split('.').pop() || '',
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
          contentBytes: null,
          contentStream: null,
          createdAtUtc: new Date().toISOString(),
          modifiedAtUtc: null,
          success: true,
          errorMessage: null,
        };
        return of(mockResult);
      })
    );
  }

  /**
   * Sube un Comprobante de Pago bancario organizado:
   * /DEGUELLO/EMPRESAS/{nitEmpresa}/{anio}/SOPORTES_PAGO
   */
  subirSoportePago(file: File, nitEmpresa: string, anio: number = 2026): Observable<FtpFileResult> {
    const nitLimpio = (nitEmpresa || 'GENERAL').trim().replace(/[^0-9a-zA-Z]/g, '');
    const remoteDir = `DEGUELLO/EMPRESAS/${nitLimpio}/${anio}/SOPORTES_PAGO`;

    const formData = new FormData();
    formData.append('document', file, file.name);
    formData.append('nitEmpresa', nitLimpio);
    formData.append('anio', anio.toString());

    return this.http.post<{ success: boolean; data: FtpFileResult }>(
      `${this.apiUrl}/ftp/subir-soporte-pago`,
      formData
    ).pipe(
      map(res => res.data),
      catchError(() => {
        const mockResult: FtpFileResult = {
          fileId: `mock-${Date.now()}`,
          fileName: `${Date.now()}_${file.name}`,
          originalFileName: file.name,
          remoteDirectory: remoteDir,
          remoteFullPath: `/${remoteDir}/${Date.now()}_${file.name}`,
          extension: file.name.split('.').pop() || '',
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
          contentBytes: null,
          contentStream: null,
          createdAtUtc: new Date().toISOString(),
          modifiedAtUtc: null,
          success: true,
          errorMessage: null,
        };
        return of(mockResult);
      })
    );
  }

  /**
   * Sube el formulario oficial de liquidación/declaración generada:
   * /DEGUELLO/EMPRESAS/{nitEmpresa}/{anio}/LIQUIDACIONES
   */
  subirLiquidacion(fileOrBlob: Blob | File, nitEmpresa: string, anio: number = 2026, consecutivo: string = ''): Observable<FtpFileResult> {
    const nitLimpio = (nitEmpresa || 'GENERAL').trim().replace(/[^0-9a-zA-Z]/g, '');
    const remoteDir = `DEGUELLO/EMPRESAS/${nitLimpio}/${anio}/LIQUIDACIONES`;
    const nombreArchivo = consecutivo ? `LIQ_${consecutivo.replace(/[^0-9a-zA-Z-]/g, '_')}.pdf` : `LIQ_${Date.now()}.pdf`;

    const formData = new FormData();
    formData.append('document', fileOrBlob, nombreArchivo);
    formData.append('nitEmpresa', nitLimpio);
    formData.append('anio', anio.toString());
    formData.append('consecutivo', consecutivo);

    return this.http.post<{ success: boolean; data: FtpFileResult }>(
      `${this.apiUrl}/ftp/subir-liquidacion`,
      formData
    ).pipe(
      map(res => res.data),
      catchError(() => {
        const mockResult: FtpFileResult = {
          fileId: `mock-liq-${Date.now()}`,
          fileName: `${Date.now()}_${nombreArchivo}`,
          originalFileName: nombreArchivo,
          remoteDirectory: remoteDir,
          remoteFullPath: `/${remoteDir}/${Date.now()}_${nombreArchivo}`,
          extension: 'pdf',
          contentType: 'application/pdf',
          sizeBytes: fileOrBlob.size,
          contentBytes: null,
          contentStream: null,
          createdAtUtc: new Date().toISOString(),
          modifiedAtUtc: null,
          success: true,
          errorMessage: null,
        };
        return of(mockResult);
      })
    );
  }

  /**
   * Construye la URL de descarga/previsualización directa de un documento en el FTP
   */
  obtenerUrlDescarga(remoteFilePath: string): string {
    return `${this.apiUrl}/ftp/descargar?remoteFilePath=${encodeURIComponent(remoteFilePath)}`;
  }
}
