export type GestionCambioEstado =
  | "EN_REVISION"
  | "REQUIERE_CORRECCION"
  | "PENDIENTE_FIRMA"
  | "EN_SEGUIMIENTO"
  | "CERRADO";

export type GestionCambioRol = "GESTION_CALIDAD" | "GERENCIA_ADMINISTRATIVA" | "LIDER_PROCESO";

export type GestionCambioWorkflowAction =
  | "SOLICITAR_CORRECCION"
  | "REENVIAR_CALIDAD"
  | "VALIDAR_REMITIR"
  | "REGISTRAR_FIRMA"
  | "CERRAR_FORMATO";

export type GestionCambioEmpresa = "Incominería" | "Dromos";

export type UsuarioGestionCambio = {
  id: string;
  nombre: string;
  correo: string;
  empresa: GestionCambioEmpresa;
  rol: GestionCambioRol;
  proceso?: string;
  activo: boolean;
};

export type PlanActividad = {
  id: number;
  actividades: string;
  responsable: string;
  fecha: string;
};

export type SolicitudCambioData = {
  empresa: GestionCambioEmpresa;
  liderProceso: string;
  proceso: string;
  tiposCambio: string[];
  analisis: Record<string, string>;
  plan: PlanActividad[];
};

export type SeguimientoCambioData = {
  cambioEficaz: "SI" | "NO" | "";
  observaciones: string;
  acciones: string;
  nombreCierre: string;
  cargoCierre: string;
  fechaCierre: string;
};

export type GestionCambioDecision = {
  accion: GestionCambioWorkflowAction;
  fecha: string;
  usuario: string;
  observaciones?: string;
};

export type GestionCambio = {
  id: string;
  codigo: string;
  fecha: string;
  empresa: GestionCambioEmpresa;
  liderProceso: string;
  proceso: string;
  tipoCambio: string;
  estado: GestionCambioEstado;
  responsableActual: GestionCambioRol;
  creadorId: string;
  liderProcesoId?: string;
  validacionCalidad?: string;
  observacionesCorreccion?: string;
  firmaGerencia?: {
    nombre: string;
    fecha: string;
  };
  seguimiento?: SeguimientoCambioData;
  historial: GestionCambioDecision[];
  detalle: SolicitudCambioData;
};
