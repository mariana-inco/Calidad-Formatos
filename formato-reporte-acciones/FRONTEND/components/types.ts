export type TipoHallazgo = "" | "No Conformidad" | "Oportunidad de Mejora" | "Salida No Conforme (SNC)";

export type ReporteEstado =
  | "Borrador"
  | "Pendiente aprobación líder"
  | "En revisión de Calidad"
  | "Devuelto para corrección"
  | "Aprobado por Calidad"
  | "En implementación"
  | "Pendiente de cierre por líder"
  | "En validación de eficacia"
  | "Cerrado"
  | "No eficaz / Requiere nueva acción";

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
  resultadoEsperado: string;
  evidenciaRequerida: string;
  observaciones: string;
  estadoIndividual: "Pendiente" | "En implementación" | "Implementada" | "Requiere ajuste";
  cierre: "Pendiente" | "Cerrado";
  fechaCierre: string;
  observacion: string;
  evidencia: string | null;
  evidenciaNombre?: string;
  justificacionSinEvidencia?: string;
};

export type ReporteHistorial = {
  id: string;
  fecha: string;
  usuario: string;
  rol: string;
  accion: string;
  estadoAnterior: ReporteEstado | null;
  estadoNuevo: ReporteEstado;
  observacion: string;
};

export type ReporteRevision = {
  id: string;
  usuario: string;
  cargo: string;
  rol: string;
  decision: string;
  comprende: boolean;
  observacion: string;
  firma: string;
  fecha: string;
};

export type ValidacionEficacia = {
  eficaz: boolean | null;
  fecha: string;
  observacion: string;
  evidencia: string | null;
  evidenciaNombre: string;
  decision: "" | "Cerrar reporte" | "Reabrir acción" | "Crear nueva acción";
  usuario: string;
};

export type ReporteAccionesData = {
  codigo: string;
  nombre: "REPORTE DE ACCIONES";
  procesoFormato: "GESTION DE CALIDAD";
  fechaFormato: "2025-10-01";
  version: string;
  proceso: string;
  liderProcesoId?: string;
  fechaHallazgo: string;
  tipoHallazgo: TipoHallazgo;
  fuente: string;
  descripcionHallazgo: string;
  usuarioCreador: string;
  causas: string;
  descripcionProblema: string;
  metodologiaAnalisis: string;
  causasIdentificadas: string;
  causaRaiz: string;
  observacionesAnalisis: string;
  consecuencias: string;
  riesgosOportunidades: string;
  estado: ReporteEstado;
  aprobadorActual: string;
  fechaSeguimientoEficacia: string;
  responsableValidarEficacia: string;
  observacionesCalidad: string;
  acciones: ReporteAccion[];
  historial?: ReporteHistorial[];
  revisiones?: ReporteRevision[];
  validacionEficacia?: ValidacionEficacia;
};

export type ReporteAccionesRol = "Colaborador" | "Líder de proceso" | "Calidad";

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
  liderProcesoId?: string;
  creadorId?: string;
  creadorNombre?: string;
  proceso: string;
  tipoHallazgo: string;
  estado: ReporteEstado;
  responsableActual: string;
  detalle: ReporteAccionesData;
};
