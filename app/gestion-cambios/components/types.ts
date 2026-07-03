export type GestionCambioEstado =
  | "Borrador"
  | "En revisión"
  | "Requiere corrección"
  | "Pendiente firma"
  | "En seguimiento"
  | "Cerrado"
  | "Aprobado"
  | "Rechazado";

export type GestionCambioAprobacion = "Pendiente" | "Devuelta" | "Validada" | "Firmada" | "Cerrada" | "Aprobada" | "Rechazada";

export type GestionCambioWorkflowAction = "solicitar-correccion" | "validar-remitir" | "registrar-firma" | "cerrar-formato";

export type GestionCambioEmpresa = "Incominería" | "Dromos";

export type GestionCambioRol = "Calidad" | "Gerencia Administrativa" | "Líder de proceso";

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

export type GestionCambio = {
  id: string;
  codigo: string;
  fecha: string;
  empresa: GestionCambioEmpresa;
  liderProceso: string;
  proceso: string;
  aprobador: string;
  tipoCambio: string;
  estado: GestionCambioEstado;
  aprobacion?: GestionCambioAprobacion;
  detalle: SolicitudCambioData;
};
