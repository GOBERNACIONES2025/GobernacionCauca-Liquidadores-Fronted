import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CalendarioDisponible,
  IntervaloDisponible,
  ObtenerCalendarioRequest,
  ObtenerIntervalosDisponiblesRequest,
  TipoPasaporte,
} from '../../domain/models/agendamiento.model';
import { CrearCitaRequest, CrearCitaResponse } from '../../domain/models/crear-cita.model';

const PASAPORTES_API_URL = 'https://localhost:7050/api';

@Injectable({ providedIn: 'root' })
export class PasaportesApiService {
  private readonly http = inject(HttpClient);

  obtenerTiposPasaporteActivos(): Observable<TipoPasaporte[]> {
    return this.http.get<TipoPasaporte[]>(`${PASAPORTES_API_URL}/tipos-pasaporte/activos`);
  }

  obtenerCalendario(anio: number, mes: number, idTipoPasaporte: number): Observable<CalendarioDisponible[]> {
    const request: ObtenerCalendarioRequest = { anio, mes, idTipoPasaporte };
    return this.http.post<CalendarioDisponible[]>(`${PASAPORTES_API_URL}/cita/obtener-calendario`, request);
  }

  obtenerIntervalosDisponibles(
    fecha: string,
    idTipo: number,
    idFormalizador: number | null,
    idTipoPasaporte: number,
  ): Observable<IntervaloDisponible[]> {
    const request: ObtenerIntervalosDisponiblesRequest = {
      fecha,
      idTipo,
      idFormalizador,
      idTipoPasaporte,
    };
    return this.http.post<IntervaloDisponible[]>(
      `${PASAPORTES_API_URL}/cita/obtener-intervalos-disponibles`,
      request,
    );
  }

  crearCita(request: CrearCitaRequest): Observable<CrearCitaResponse> {
    return this.http.post<CrearCitaResponse>(`${PASAPORTES_API_URL}/cita/crear-cita`, request);
  }
}
