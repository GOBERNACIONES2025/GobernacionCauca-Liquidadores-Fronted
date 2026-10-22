export interface LiquidadorConsultaExample {
  label: string;
  tipoDocId?: number;
  doc: string;
  secondary: string;
  tag: string;
}

export interface LiquidadorConsultaConfig {
  id: 'automotores' | 'pasaportes' | 'registros' | 'deguello';
  brandingTitle: string;            // Ej: "IMPUESTO VEHICULAR"
  headerTitle: string;              // Ej: "CONSULTA CIUDADANA"
  headerSubtitle: string;           // Ej: "Consulte su impuesto vehicular y estado de cuenta."
  secondaryFieldKey: string;        // Ej: "placa"
  secondaryFieldLabel: string;      // Ej: "PLACA DEL VEHÍCULO"
  secondaryFieldPlaceholder: string;// Ej: "Ej: QWE-123"
  secondaryFieldIcon: string;       // Ej: "fa-car"
  buttonText: string;               // Ej: "Consultar Vehículo"
  buttonIcon: string;               // Ej: "fa-magnifying-glass"
  iconSvg?: string;                 // Ruta al SVG del liquidador (ej: '/vehicular.svg')
  headerBgColor: string;            // Ej: "bg-[#0f4984]"
  brandingTextColor: string;        // Ej: "text-[#0f4984]"
  buttonBgColor: string;            // Ej: "bg-[#0f4984] hover:bg-[#0c3c6d]"
  iconBadgeColor: string;           // Ej: "bg-blue-50 text-[#0f4984] border-blue-100"
  quickExamples: LiquidadorConsultaExample[];
}

export const LIQUIDADORES_CONSULTA_CONFIG: Record<string, LiquidadorConsultaConfig> = {
  automotores: {
    id: 'automotores',
    brandingTitle: 'IMPUESTO VEHICULAR',
    headerTitle: 'CONSULTA CIUDADANA',
    headerSubtitle: 'Consulte el impuesto sobre vehículos automotores, estado de cuenta y paz y salvo.',
    secondaryFieldKey: 'placa',
    secondaryFieldLabel: 'PLACA DEL VEHÍCULO:',
    secondaryFieldPlaceholder: 'Ej: AAA001',
    secondaryFieldIcon: 'fa-car',
    buttonText: 'Consultar Impuesto Vehicular',
    buttonIcon: 'fa-magnifying-glass',
    iconSvg: '/vehicular.svg',
    headerBgColor: 'bg-[#0f4984]',
    brandingTextColor: 'text-[#0f4984]',
    buttonBgColor: 'bg-[#0f4984] hover:bg-[#0c3c6d]',
    iconBadgeColor: 'bg-blue-50 text-[#0f4984] border-blue-100',
    quickExamples: []
  },
  pasaportes: {
    id: 'pasaportes',
    brandingTitle: 'PASAPORTES',
    headerTitle: 'SOLICITUD DE PASAPORTE',
    headerSubtitle: 'Bienvenido al portal oficial de la Gobernación del Cauca para la expedición y agendamiento de citas de pasaporte.',
    secondaryFieldKey: '',
    secondaryFieldLabel: '',
    secondaryFieldPlaceholder: '',
    secondaryFieldIcon: 'fa-passport',
    buttonText: 'Hacer Solicitud de Pasaporte',
    buttonIcon: 'fa-file-pen',
    iconSvg: '/pasaporte.svg',
    headerBgColor: 'bg-[#0f4984]',
    brandingTextColor: 'text-[#0f4984]',
    buttonBgColor: 'bg-[#0f4984] hover:bg-[#0c3c6d]',
    iconBadgeColor: 'bg-blue-50 text-[#0f4984] border-blue-100',
    quickExamples: []
  },
  registros: {
    id: 'registros',
    brandingTitle: 'IMPUESTO DE REGISTRO',
    headerTitle: 'CONSULTA DE IMPUESTO DE REGISTRO',
    headerSubtitle: 'Consulte el impuesto de registro departamental para actos y escrituras notariales.',
    secondaryFieldKey: 'radicado',
    secondaryFieldLabel: 'NÚMERO DE RADICADO:',
    secondaryFieldPlaceholder: 'Ej: RAD-2026-0001',
    secondaryFieldIcon: 'fa-barcode',
    buttonText: 'Consultar Radicado',
    buttonIcon: 'fa-file-circle-check',
    iconSvg: '/registros.svg',
    headerBgColor: 'bg-[#0f4984]',
    brandingTextColor: 'text-[#0f4984]',
    buttonBgColor: 'bg-[#0f4984] hover:bg-[#0c3c6d]',
    iconBadgeColor: 'bg-blue-50 text-[#0f4984] border-blue-100',
    quickExamples: []
  },
  deguello: {
    id: 'deguello',
    brandingTitle: 'IMPUESTO DE DEGÜELLO',
    headerTitle: 'CONSULTA Y DECLARACIÓN DE DEGÜELLO',
    headerSubtitle: 'Consulte guías de sacrificio, liquidaciones y formulario único de ganado mayor.',
    secondaryFieldKey: 'guia',
    secondaryFieldLabel: 'NÚMERO DE GUÍA ICA / FORMULARIO:',
    secondaryFieldPlaceholder: 'Ej: GSMI-2026-004521',
    secondaryFieldIcon: 'fa-cow',
    buttonText: 'Consultar Guía de Degüello',
    buttonIcon: 'fa-magnifying-glass',
    iconSvg: '/deguello.svg',
    headerBgColor: 'bg-[#1b53ad]',
    brandingTextColor: 'text-[#1b53ad]',
    buttonBgColor: 'bg-[#1b53ad] hover:bg-[#154189]',
    iconBadgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    quickExamples: []
  }
};
