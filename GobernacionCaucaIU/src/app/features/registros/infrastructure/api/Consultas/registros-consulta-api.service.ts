import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../../core/services/base-api.service';
import { ApiResponse } from '../../../../../core/shared/models/shared.model';
import { ConsultaRadicadoRequest, ConsultaRadicadoData } from '../../../domain/models/Consultas/consulta-radicado.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrosConsultaApiService {
  private api = inject(BaseApiService);
  private readonly baseUrl = '/Consultas/Radicado';
  private readonly dbContext = 'REGISTROS';

  consultarRadicado(request: ConsultaRadicadoRequest): Observable<ApiResponse<ConsultaRadicadoData>> {
    return this.api.post<ApiResponse<ConsultaRadicadoData>>(this.baseUrl, request, {}, this.dbContext);
  }
}
