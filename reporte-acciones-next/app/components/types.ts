export type TipoHallazgo = "" | "No Conformidad" | "Oportunidad de Mejora" | "Salida No Conforme (SNC)";

export type ReporteEstado =
  | "Borrador"
  | "En revisión de Calidad"
  | "Requiere corrección"
  | "Aprobada por Calidad"
  | "En cierre por líder"
  | "Cierre enviado a Calidad"
  | "Cerrado";

export type ReporteAccionFlujo =
  | "enviar-calidad"
  | "solicitar-correccion"
  | "reenviar-calidad"
  | "aprobar-definir-seguimiento"
  | "remitir-lider"
  | "enviar-cierre-calidad"
  | "cerrar-formato";

export type ReporteAccion = {
  id: string;
  numero: number;
  tipoAccion: string;
  descripcionAccion: string;
  fechaImplementacion: string;
  responsableImplementacion: string;
  cierre: "Pendiente" | "Cerrado";
  fechaCierre: string;
  observacion: string;
  evidencia: string | null;
};

export type ReporteAccionesData = {
  codigo: string;
  nombre: "REPORTE DE ACCIONES";
  procesoFormato: "GESTION DE CALIDAD";
  fechaFormato: "2025-10-01";
  version: string;
  proceso: string;
  fechaHallazgo: string;
  tipoHallazgo: TipoHallazgo;
  fuente: string;
  descripcionHallazgo: string;
  causas: string;
  consecuencias: string;
  riesgosOportunidades: string;
  estado: ReporteEstado;
  aprobadorActual: string;
  fechaSeguimientoEficacia: string;
  observacionesCalidad: string;
  acciones: ReporteAccion[];
};

export type ReporteAccionesRol = "Líder de proceso" | "Calidad";

export type UsuarioReporteAcciones = {
  id: string;
  nombre: string;
  correo: string;
  empresa: string;
  rol: ReporteAccionesRol;
  proceso?: string;
  activo: boolean;
};

export type ReporteAccionesRegistro = {
  id: string;
  consecutivo: string;
  fechaCreacion: string;
  liderProceso: string;
  proceso: string;
  tipoHallazgo: string;
  estado: ReporteEstado;
  responsableActual: string;
  detalle: ReporteAccionesData;
};
