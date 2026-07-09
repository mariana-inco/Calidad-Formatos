export type GestionCambioEstado =
  | "BORRADOR"
  | "CREADO"
  | "PENDIENTE_APROBACION_LIDER"
  | "RECHAZADO_LIDER"
  | "EN_REVISION_CALIDAD"
  | "DEVUELTO_LIDER"
  | "PENDIENTE_APROBACION"
  | "RECHAZADO_APROBADOR"
  | "EN_SEGUIMIENTO_CALIDAD"
  | "APROBADO"
  | "CERRADO"
  | "VENCIDO";

export type GestionCambioRol =
  | "COLABORADOR"
  | "GESTION_CALIDAD"
  | "GERENCIA_ADMINISTRATIVA"
  | "LIDER_PROCESO"
  | "APROBADOR_ADICIONAL";

export type GestionCambioWorkflowAction =
  | "CREAR_REGISTRO"
  | "GUARDAR_BORRADOR"
  | "ENVIAR_LIDER"
  | "ENVIAR_CALIDAD"
  | "APROBAR_LIDER"
  | "RECHAZAR_LIDER"
  | "SOLICITAR_CORRECCION"
  | "REENVIAR_CALIDAD"
  | "VALIDAR_REMITIR"
  | "REGISTRAR_APROBACION"
  | "REGISTRAR_RECHAZO"
  | "CERRAR_FORMATO";

export type GestionCambioEmpresa = "Dromos" | "Incominería" | "Ingestrac" | "Drominc";

export type UsuarioGestionCambio = {
  id: string;
  nombre: string;
  correo: string;
  empresa: GestionCambioEmpresa;
  rol: GestionCambioRol;
  cargo?: string;
  proceso?: string;
  activo: boolean;
};

export type PlanActividad = {
  id: number;
  actividades: string;
  responsableId?: string;
  responsable: string;
  fecha: string;
};

export type SolicitudCambioData = {
  empresa: GestionCambioEmpresa;
  liderProceso?: string;
  liderProcesoId?: string;
  proceso: string;
  tiposCambio: string[];
  analisis: Record<string, string>;
  plan: PlanActividad[];
  aprobadorSeleccionadoId?: string;
};

export type SeguimientoCambioData = {
  cambioEficaz: "SI" | "NO" | "";
  observaciones: string;
  acciones: string;
  nombreCierre: string;
  cargoCierre: string;
  fechaSeguimiento: string;
  fechaCierre: string;
};

export type GestionCambioDecision = {
  accion: GestionCambioWorkflowAction;
  fecha: string;
  usuarioId?: string;
  usuario: string;
  rol?: GestionCambioRol;
  cargo?: string;
  estadoAnterior?: GestionCambioEstado;
  estadoNuevo?: GestionCambioEstado;
  observaciones?: string;
  aprobadorSeleccionadoId?: string;
  aprobadorSeleccionadoNombre?: string;
};

export type AprobacionCambioData = {
  aprobado: "SI" | "NO";
  nombre: string;
  cargo: string;
  fecha: string;
  observaciones: string;
  firma?: string;
  rolAprobador: GestionCambioRol;
};

export type GestionCambio = {
  id: string;
  codigo: string;
  fecha: string;
  fechaHora?: string;
  empresa: GestionCambioEmpresa;
  liderProceso: string;
  proceso: string;
  tipoCambio: string;
  estado: GestionCambioEstado;
  responsableActual: GestionCambioRol;
  responsableActualId?: string;
  responsableActualNombre?: string;
  creadorId: string;
  creadorNombre?: string;
  liderProcesoId?: string;
  aprobadorSeleccionadoId?: string;
  aprobadorSeleccionadoNombre?: string;
  aprobadorSeleccionadoRol?: GestionCambioRol;
  validacionCalidad?: string;
  observacionesCorreccion?: string;
  aprobacion?: AprobacionCambioData;
  aprobaciones?: AprobacionCambioData[];
  seguimiento?: SeguimientoCambioData;
  fechaAprobacion?: string;
  fechaInicioSeguimiento?: string;
  fechaLimiteCierre?: string;
  fechaCierre?: string;
  historial: GestionCambioDecision[];
  detalle: SolicitudCambioData;
};
