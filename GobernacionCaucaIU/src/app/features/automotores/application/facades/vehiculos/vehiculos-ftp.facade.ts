import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { FtpApiService } from '../../../infrastructure/api/ftp-api.service';
import { FtpFileResult } from '../../../domain/interfaces/ftp-file-result';

@Injectable({
  providedIn: 'root'
})
export class VehiculosFtpFacade {

  private readonly ftpService = inject(FtpApiService);

  uploadAnyDocument(
    file: File,
    remoteDirectory: string
  ): Observable<FtpFileResult> {

    const formData = new FormData();

    formData.append(
      'document',
      file,
      file.name
    );

    return this.ftpService
      .upAnyDocument(formData, remoteDirectory)
      .pipe(
        map(response => response.data)
      );
  }
}