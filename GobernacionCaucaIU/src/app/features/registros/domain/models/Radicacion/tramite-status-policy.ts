/**
 * Política y mapeo visual de estados para solicitudes de radicación y liquidación
 * Módulo de Registros - Gobernación del Cauca
 */

export interface TramiteStatusConfig {
  id: number;
  codigo: string;
  label: string;
  badgeClass: string;
  dotClass: string;
  icon: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja' | 'neutra';
}

export const TRAMITE_STATUS_MAP: Record<number, TramiteStatusConfig> = {
  1: {
    id: 1,
    codigo: 'BORRADOR',
    label: 'En Diligenciamiento',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/10',
    dotClass: 'bg-amber-500',
    icon: 'fa-pencil',
    descripcion: 'Solicitud guardada en borrador sin radicar formalmente.',
    prioridad: 'media'
  },
  2: {
    id: 2,
    codigo: 'EN_REVISION',
    label: 'En Revisión Técnica',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 ring-1 ring-blue-500/10',
    dotClass: 'bg-blue-500',
    icon: 'fa-clock',
    descripcion: 'Radicada formalmente. En estudio fiscal por la Gobernación del Cauca.',
    prioridad: 'media'
  },
  3: {
    id: 3,
    codigo: 'EN_RELIQUIDACION',
    label: 'En Trámite de Reliquidación',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-500/10',
    dotClass: 'bg-purple-500',
    icon: 'fa-rotate',
    descripcion: 'Solicitud de reliquidación en curso ante la Dirección de Rentas.',
    prioridad: 'media'
  },
  4: {
    id: 4,
    codigo: 'LIQUIDADA',
    label: 'Liquidada Oficial',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/10',
    dotClass: 'bg-emerald-500',
    icon: 'fa-circle-check',
    descripcion: 'Liquidación aprobada con título oficial expedido.',
    prioridad: 'baja'
  },
  5: {
    id: 5,
    codigo: 'DEVUELTA',
    label: 'Devuelta (Por Subsanar)',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-500/20 shadow-xs',
    dotClass: 'bg-rose-500 animate-ping',
    icon: 'fa-triangle-exclamation',
    descripcion: 'Requiere subsanación inmediata por objeción técnica o documental.',
    prioridad: 'alta'
  },
  6: {
    id: 6,
    codigo: 'ANULADA',
    label: 'Anulada / Descartada',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    icon: 'fa-ban',
    descripcion: 'Trámite cancelado o revocado formalmente.',
    prioridad: 'neutra'
  }
};

export const ETAPAS_WIZARD_MAP: Record<number, string> = {
  1: 'Paso 01: Radicación & Vigencia',
  2: 'Paso 02: Documento Notarial',
  3: 'Paso 03: Actos Registrales',
  4: 'Paso 04: Intervinientes',
  5: 'Paso 05: Simulación & Envío'
};

export function getTramiteStatusConfig(estadoId: number): TramiteStatusConfig {
  return TRAMITE_STATUS_MAP[estadoId] || {
    id: estadoId,
    codigo: 'DESCONOCIDO',
    label: 'Estado #' + estadoId,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    icon: 'fa-circle-info',
    descripcion: 'Estado no clasificado',
    prioridad: 'neutra'
  };
}

export function getEtapaWizardLabel(etapa: number): string {
  return ETAPAS_WIZARD_MAP[etapa] || `Paso 0${etapa}`;
}
