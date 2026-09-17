export interface CupoTipoDiaDemo {
  tipoCitaId: number;
  abiertos: number;
  reservados: number;
}

export interface AperturaCuposDiaDemo {
  fecha: string;
  cupos: CupoTipoDiaDemo[];
}

export interface CupoSemanaEdicionDemo {
  fecha: string;
  cupos: Array<{
    tipoCitaId: number;
    valor: number;
  }>;
}
