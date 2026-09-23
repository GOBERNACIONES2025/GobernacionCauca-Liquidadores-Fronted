import { inject, Injectable } from '@angular/core';
import { BaseApiService } from '../../../../core/services/base-api.service';
import { FtpFileResult } from '../../domain/interfaces/ftp-file-result';
import { ApiResponse } from '../../domain/models/vehiculo.model';

@Injectable({
  providedIn: 'root'
})
export class FtpApiService {

  private readonly api = inject(BaseApiService);

  upAnyDocument(
    formData: FormData,
    remoteDirectory: string
  ) {
    return this.api.post<ApiResponse<FtpFileResult>>(
      `/Ftp/up-document?remoteDirectory=${encodeURIComponent(remoteDirectory)}`,
      formData,
      {},
      'AUTOMOTORES'
    );
  }
}