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
    quickExamples: [
      { label: 'Vehículo Prueba Real', tipoDocId: 1, doc: '11223344', secondary: 'AAA001', tag: 'DS 3' },
      { label: 'Consulta Alterna', tipoDocId: 1, doc: '1234567', secondary: 'AAA000', tag: 'Prueba' }
    ]
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
    secondaryFieldLabel: 'NÚMERO DE RADICADO O MATRÍCULA:',
    secondaryFieldPlaceholder: 'Ej: RAD-2026-4410',
    secondaryFieldIcon: 'fa-barcode',
    buttonText: 'Consultar Impuesto de Registro',
    buttonIcon: 'fa-file-circle-check',
    iconSvg: '/registros.svg',
    headerBgColor: 'bg-[#0f4984]',
    brandingTextColor: 'text-[#0f4984]',
    buttonBgColor: 'bg-[#0f4984] hover:bg-[#0c3c6d]',
    iconBadgeColor: 'bg-blue-50 text-[#0f4984] border-blue-100',
    quickExamples: [
      { label: 'Radicado Liquidado 1', tipoDocId: 1, doc: '12345678', secondary: 'RAD-2026-4410', tag: 'Notaría 1' },
      { label: 'Radicado Liquidado 2', tipoDocId: 1, doc: '11223344', secondary: 'RAD-2026-5512', tag: 'Notaría 2' }
    ]
  },
  deguello: {
    id: 'deguello',
    brandingTitle: 'IMPUESTO DE DEGÜELLO',
    headerTitle: 'IMPUESTO DE DEGÜELLO',
    headerSubtitle: 'Servicio en desarrollo próximamente disponible.',
    secondaryFieldKey: 'guia',
    secondaryFieldLabel: 'NÚMERO DE GUÍA DE SACRIFICIO:',
    secondaryFieldPlaceholder: 'Ej: GUI-2026-9012',
    secondaryFieldIcon: 'fa-file-invoice',
    buttonText: 'Consultar Guía de Degüello',
    buttonIcon: 'fa-cow',
    iconSvg: '/deguello.svg',
    headerBgColor: 'bg-[#0f4984]',
    brandingTextColor: 'text-[#0f4984]',
    buttonBgColor: 'bg-[#0f4984] hover:bg-[#0c3c6d]',
    iconBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    quickExamples: []
  }
};
