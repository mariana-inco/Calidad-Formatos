import type {
  ReporteAccion,
  ReporteAccionesData,
  ReporteAccionesRegistro,
  ReporteEstado,
  ReporteHistorial,
  ReporteRevision,
  TipoHallazgo,
  UsuarioReporteAcciones,
  ValidacionEficacia,
} from "@/FRONTEND/components/types";
import { prisma } from "./prisma";

type EmpresaRocaKey = "INCO" | "DROMOS";

const empresaActiva: EmpresaRocaKey = "INCO";
const formatosPorEmpresa: Record<EmpresaRocaKey, { codigo: string; version: string; consecutivoPrefix: string }> = {
  INCO: { codigo: "SIG-FO05", version: "04", consecutivoPrefix: "ACOM" },
  DROMOS: { codigo: "SIG-F005", version: "04", consecutivoPrefix: "ACOM" },
};

const usuariosRocaTemporal: UsuarioReporteAcciones[] = [
  {
    id: "usuario-colaborador-demo",
    nombre: "Colaborador ROCA",
    correo: "colaborador@roca.local",
    empresa: "INCO",
    rol: "Colaborador",
    proceso: "Gestión de Calidad",
    activo: true,
  },
  {
    id: "usuario-lider-demo",
    nombre: "Líder de proceso",
    correo: "lider.proceso@roca.local",
    empresa: "INCO",
    rol: "Líder de proceso",
    proceso: "Gestión de Calidad",
    activo: true,
  },
  {
    id: "usuario-calidad-demo",
    nombre: "Gestión de Calidad",
    correo: "calidad@roca.local",
    empresa: "INCO",
    rol: "Calidad",
    proceso: "Gestión de Calidad",
    activo: true,
  },
];

type ReportRow = Awaited<ReturnType<typeof findReport>>;

function required(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }
  return value.trim();
}

function parseDate(value: string | Date | null | undefined) {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function dateOnly(value?: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

function formatConsecutivo(numero: number) {
  const { consecutivoPrefix } = formatosPorEmpresa[empresaActiva];
  return `${consecutivoPrefix}-${new Date().getFullYear()}-${String(numero).padStart(3, "0")}`;
}

function createEmptyValidation(): ValidacionEficacia {
  return {
    eficaz: null,
    fecha: "",
    observacion: "",
    evidencia: null,
    evidenciaNombre: "",
    decision: "",
    usuario: "",
  };
}

function validateReporte(data: ReporteAccionesData) {
  required(data.proceso, "El proceso");
  required(data.fechaHallazgo, "La fecha del hallazgo");
  required(data.tipoHallazgo, "El tipo de hallazgo");
  if (data.fuente === "Seleccione una opción") throw new Error("La fuente es obligatoria.");
  required(data.descripcionHallazgo, "La descripción del hallazgo");
  required(data.descripcionProblema, "La descripción del problema");
  required(data.metodologiaAnalisis, "La metodología utilizada");
  required(data.causasIdentificadas, "Las causas identificadas");
  required(data.causaRaiz, "La causa raíz");
  required(data.causas, "Las causas");
  required(data.consecuencias, "Las consecuencias");
  required(data.riesgosOportunidades, "Los riesgos y oportunidades");
  if (!Array.isArray(data.acciones) || data.acciones.length === 0) {
    throw new Error("Agrega al menos una acción.");
  }
}

function validateAcciones(acciones: ReporteAccion[]) {
  acciones.forEach((accion, index) => {
    required(accion.tipoAccion, `El tipo de acción ${index + 1}`);
    if (accion.tipoAccion === "Seleccione una opción") throw new Error(`El tipo de acción ${index + 1} es obligatorio.`);
    required(accion.descripcionAccion, `La descripción de la acción ${index + 1}`);
    required(accion.fechaImplementacion, `La fecha de implementación de la acción ${index + 1}`);
    required(accion.responsableImplementacion, `El responsable de la acción ${index + 1}`);
    required(accion.resultadoEsperado, `El resultado esperado de la acción ${index + 1}`);
    required(accion.evidenciaRequerida, `La evidencia requerida de la acción ${index + 1}`);
  });
}

function hasHistoryAction(registro: ReporteAccionesRegistro, action: string) {
  return (registro.detalle.historial ?? []).some((item) => item.accion === action);
}

function hasReviewDecision(registro: ReporteAccionesRegistro, decision: string) {
  return (registro.detalle.revisiones ?? []).some((item) => item.decision === decision && item.firma);
}

function validateClosedActions(registro: ReporteAccionesRegistro) {
  const incomplete = registro.detalle.acciones.find(
    (accion) =>
      accion.cierre !== "Cerrado" ||
      !accion.fechaCierre ||
      (!accion.evidencia && !accion.justificacionSinEvidencia?.trim()),
  );
  if (incomplete) {
    throw new Error("Todas las acciones deben estar cerradas, con fecha y evidencia o justificación antes de solicitar validación de eficacia.");
  }
}

function validateWorkflowTransition(currentStatus: string, registro: ReporteAccionesRegistro) {
  const nextStatus = registro.estado;
  const allowedTransitions: Record<string, ReporteEstado[]> = {
    "Pendiente aprobación líder": ["En revisión de Calidad", "Devuelto para corrección"],
    "En revisión de Calidad": ["Devuelto para corrección", "Aprobado por Calidad"],
    "Devuelto para corrección": ["Devuelto para corrección", "En revisión de Calidad"],
    "Aprobado por Calidad": ["Aprobado por Calidad", "En implementación"],
    "En implementación": ["En implementación", "En validación de eficacia"],
    "No eficaz / Requiere nueva acción": ["No eficaz / Requiere nueva acción", "En validación de eficacia"],
    "En validación de eficacia": ["Cerrado", "No eficaz / Requiere nueva acción"],
    Cerrado: ["Cerrado"],
  };

  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    throw new Error("El cambio de estado solicitado no corresponde al flujo del Reporte de Acciones.");
  }

  if (currentStatus === "Pendiente aprobación líder" && nextStatus === "En revisión de Calidad") {
    if (!hasHistoryAction(registro, "Aprobó el líder y envió a Calidad")) {
      throw new Error("La aprobación del líder debe quedar registrada antes de enviar a Calidad.");
    }
  }

  if (currentStatus === "Pendiente aprobación líder" && nextStatus === "Devuelto para corrección") {
    if (!hasHistoryAction(registro, "Devolvió el líder para corrección")) {
      throw new Error("La devolución del líder debe quedar registrada en la trazabilidad.");
    }
  }

  if (currentStatus !== "Pendiente aprobación líder" && nextStatus === "Devuelto para corrección") {
    required(registro.detalle.observacionesCalidad, "La observación de Calidad");
    if (!hasReviewDecision(registro, "Devuelto para corrección")) {
      throw new Error("La devolución debe quedar firmada por Gestión de Calidad.");
    }
  }

  if (nextStatus === "Aprobado por Calidad") {
    required(registro.detalle.fechaSeguimientoEficacia, "La fecha de seguimiento de eficacia");
    required(registro.detalle.responsableValidarEficacia, "El responsable de validar eficacia");
    required(registro.detalle.observacionesCalidad, "Las observaciones de Calidad");
    if (!hasReviewDecision(registro, "Aprobado por Calidad")) {
      throw new Error("La aprobación debe quedar firmada por Gestión de Calidad.");
    }
  }

  if (currentStatus === "Devuelto para corrección" && nextStatus === "En revisión de Calidad") {
    if (!hasHistoryAction(registro, "Corrigió y reenvió el reporte")) {
      throw new Error("El reenvío a Calidad debe registrar la corrección en la trazabilidad.");
    }
  }

  if (nextStatus === "En implementación") {
    required(registro.detalle.fechaSeguimientoEficacia, "La fecha de seguimiento de eficacia");
    required(registro.detalle.responsableValidarEficacia, "El responsable de validar eficacia");
    if (!hasHistoryAction(registro, "Remitió el reporte al líder")) {
      throw new Error("La remisión al líder debe quedar registrada en la trazabilidad.");
    }
  }

  if (nextStatus === "En validación de eficacia") {
    validateClosedActions(registro);
    if (!hasHistoryAction(registro, "Solicitó validación de eficacia")) {
      throw new Error("La solicitud de validación debe quedar registrada en la trazabilidad.");
    }
  }

  if (nextStatus === "Cerrado") {
    if (registro.detalle.validacionEficacia?.eficaz !== true || registro.detalle.validacionEficacia.decision !== "Cerrar reporte") {
      throw new Error("Para cerrar el reporte, Calidad debe validar la eficacia con decisión Cerrar reporte.");
    }
    if (!hasReviewDecision(registro, "Cerrar reporte")) {
      throw new Error("El cierre debe quedar firmado por Gestión de Calidad.");
    }
  }

  if (nextStatus === "No eficaz / Requiere nueva acción") {
    if (registro.detalle.validacionEficacia?.eficaz !== false || registro.detalle.validacionEficacia.decision === "Cerrar reporte") {
      throw new Error("Una acción no eficaz debe reabrirse o generar una nueva acción.");
    }
    if (!registro.detalle.validacionEficacia?.decision || !hasReviewDecision(registro, registro.detalle.validacionEficacia.decision)) {
      throw new Error("La decisión de no eficacia debe quedar firmada por Gestión de Calidad.");
    }
  }
}

function getActor(userId?: string | null) {
  const actor = usuariosRocaTemporal.find((user) => user.id === userId && user.activo);
  return actor ?? usuariosRocaTemporal[0];
}

async function findReport(id: string) {
  return prisma.registroReporteAcciones.findUnique({
    where: { id },
    include: {
      acciones: { orderBy: { number: "asc" } },
      movimientos: { orderBy: { eventDate: "asc" } },
    },
  });
}

function toAction(row: NonNullable<ReportRow>["acciones"][number]): ReporteAccion {
  return {
    id: row.clientId,
    numero: row.number,
    tipoAccion: row.actionType,
    descripcionAccion: row.actionDescription,
    fechaImplementacion: row.implementationDate,
    responsableImplementacion: row.implementationResponsible,
    resultadoEsperado: row.expectedResult,
    evidenciaRequerida: row.requiredEvidence,
    observaciones: row.observations,
    estadoIndividual: row.individualStatus as ReporteAccion["estadoIndividual"],
    cierre: row.closeStatus as ReporteAccion["cierre"],
    fechaCierre: row.closeDate ?? "",
    observacion: row.closeObservation ?? "",
    evidencia: row.evidence,
    evidenciaNombre: row.evidenceName ?? undefined,
    justificacionSinEvidencia: row.noEvidenceJustification ?? undefined,
  };
}

function toHistory(row: NonNullable<ReportRow>["movimientos"][number]): ReporteHistorial {
  return {
    id: row.clientId,
    fecha: row.eventDate.toISOString(),
    usuario: row.userName,
    rol: row.role,
    accion: row.action,
    estadoAnterior: row.fromStatus as ReporteEstado | null,
    estadoNuevo: row.toStatus as ReporteEstado,
    observacion: row.observation ?? "",
  };
}

function toReview(row: NonNullable<ReportRow>["movimientos"][number]): ReporteRevision {
  return {
    id: row.clientId,
    usuario: row.userName,
    cargo: row.position ?? "",
    rol: row.role,
    decision: row.decision ?? row.action,
    comprende: row.understands ?? true,
    observacion: row.observation ?? "",
    firma: row.signature ?? "",
    fecha: row.eventDate.toISOString(),
  };
}

function toRegistro(row: NonNullable<ReportRow>): ReporteAccionesRegistro {
  const validacionEficacia: ValidacionEficacia =
    row.effectivenessResult === null &&
    !row.effectivenessValidationDate &&
    !row.effectivenessObservation &&
    !row.effectivenessDecision
      ? createEmptyValidation()
      : {
          eficaz: row.effectivenessResult,
          fecha: row.effectivenessValidationDate?.toISOString() ?? "",
          observacion: row.effectivenessObservation ?? "",
          evidencia: row.effectivenessEvidence,
          evidenciaNombre: row.effectivenessEvidenceName ?? "",
          decision: (row.effectivenessDecision ?? "") as ValidacionEficacia["decision"],
          usuario: row.effectivenessUser ?? "",
        };

  const detalle: ReporteAccionesData = {
    codigo: row.formatCode,
    nombre: "REPORTE DE ACCIONES",
    procesoFormato: "GESTION DE CALIDAD",
    fechaFormato: row.formatDate as ReporteAccionesData["fechaFormato"],
    version: row.formatVersion,
    proceso: row.process,
    fechaHallazgo: row.findingDate,
    tipoHallazgo: row.findingType as TipoHallazgo,
    fuente: row.source,
    descripcionHallazgo: row.findingDescription,
    usuarioCreador: row.creatorName,
    causas: row.causes,
    descripcionProblema: row.problemDescription,
    metodologiaAnalisis: row.analysisMethodology,
    causasIdentificadas: row.identifiedCauses,
    causaRaiz: row.rootCause,
    observacionesAnalisis: row.analysisObservations,
    consecuencias: row.consequences,
    riesgosOportunidades: row.risksOpportunities,
    estado: row.status as ReporteEstado,
    aprobadorActual: row.currentResponsible,
    fechaSeguimientoEficacia: row.effectivenessFollowupDate ?? "",
    responsableValidarEficacia: row.effectivenessResponsible ?? "",
    observacionesCalidad: row.qualityObservations ?? "",
    acciones: row.acciones.map(toAction),
    historial: row.movimientos.filter((movement) => movement.type === "HISTORIAL").map(toHistory),
    revisiones: row.movimientos.filter((movement) => movement.type === "REVISION").map(toReview),
    validacionEficacia,
  };

  return {
    id: row.id,
    consecutivo: row.consecutivo ?? formatConsecutivo(row.numero),
    fechaCreacion: row.createdAt.toISOString(),
    liderProceso: row.leaderName,
    liderProcesoId: row.leaderUserId ?? undefined,
    creadorId: row.creatorUserId ?? undefined,
    creadorNombre: row.creatorName,
    proceso: row.process,
    tipoHallazgo: row.findingType,
    estado: row.status as ReporteEstado,
    responsableActual: row.currentResponsible,
    detalle,
  };
}

function actionCreateRows(reportId: string, acciones: ReporteAccion[]) {
  return acciones.map((accion, index) => ({
    reportId,
    clientId: accion.id || `${reportId}-accion-${index + 1}`,
    number: accion.numero || index + 1,
    actionType: accion.tipoAccion,
    actionDescription: accion.descripcionAccion,
    implementationDate: accion.fechaImplementacion,
    implementationResponsible: accion.responsableImplementacion,
    expectedResult: accion.resultadoEsperado,
    requiredEvidence: accion.evidenciaRequerida,
    observations: accion.observaciones,
    individualStatus: accion.estadoIndividual,
    closeStatus: accion.cierre,
    closeDate: accion.fechaCierre || null,
    closeObservation: accion.observacion || null,
    evidence: accion.evidencia,
    evidenceName: accion.evidenciaNombre ?? null,
    noEvidenceJustification: accion.justificacionSinEvidencia ?? null,
  }));
}

function historyMovementRows(reportId: string, historial: ReporteHistorial[] = []) {
  return historial.map((item, index) => ({
    reportId,
    clientId: item.id || `${reportId}-historial-${index + 1}`,
    type: "HISTORIAL",
    eventDate: parseDate(item.fecha),
    userName: item.usuario,
    role: item.rol,
    action: item.accion,
    fromStatus: item.estadoAnterior ?? null,
    toStatus: item.estadoNuevo,
    observation: item.observacion,
    position: null,
    decision: null,
    understands: null,
    signature: null,
  }));
}

function reviewMovementRows(reportId: string, revisiones: ReporteRevision[] = []) {
  return revisiones.map((item, index) => ({
    reportId,
    clientId: item.id || `${reportId}-revision-${index + 1}`,
    type: "REVISION",
    eventDate: parseDate(item.fecha),
    userName: item.usuario,
    position: item.cargo,
    role: item.rol,
    action: item.decision,
    fromStatus: null,
    toStatus: null,
    decision: item.decision,
    understands: item.comprende,
    observation: item.observacion,
    signature: item.firma,
  }));
}

function reportUpdateData(registro: ReporteAccionesRegistro) {
  const detalle = registro.detalle;
  const validation = detalle.validacionEficacia;

  return {
    formatCode: detalle.codigo,
    formatVersion: detalle.version,
    formatName: detalle.nombre,
    formatProcess: detalle.procesoFormato,
    formatDate: detalle.fechaFormato,
    leaderName: registro.liderProceso,
    leaderUserId: registro.liderProcesoId ?? null,
    creatorUserId: registro.creadorId ?? null,
    creatorName: detalle.usuarioCreador || registro.liderProceso,
    process: detalle.proceso,
    findingDate: detalle.fechaHallazgo,
    findingType: detalle.tipoHallazgo,
    source: detalle.fuente,
    findingDescription: detalle.descripcionHallazgo,
    causes: detalle.causas,
    problemDescription: detalle.descripcionProblema,
    analysisMethodology: detalle.metodologiaAnalisis,
    identifiedCauses: detalle.causasIdentificadas,
    rootCause: detalle.causaRaiz,
    analysisObservations: detalle.observacionesAnalisis,
    consequences: detalle.consecuencias,
    risksOpportunities: detalle.riesgosOportunidades,
    status: registro.estado,
    currentResponsible: registro.responsableActual,
    effectivenessFollowupDate: detalle.fechaSeguimientoEficacia || null,
    effectivenessResponsible: detalle.responsableValidarEficacia || null,
    qualityObservations: detalle.observacionesCalidad || null,
    effectivenessValidationDate: validation?.fecha ? parseDate(validation.fecha) : null,
    effectivenessResult: validation?.eficaz ?? null,
    effectivenessObservation: validation?.observacion || null,
    effectivenessEvidence: validation?.evidencia ?? null,
    effectivenessEvidenceName: validation?.evidenciaNombre || null,
    effectivenessDecision: validation?.decision || null,
    effectivenessUser: validation?.usuario || null,
  };
}

export async function getReporteAccionesData() {
  const rows = await prisma.registroReporteAcciones.findMany({
    include: {
      acciones: { orderBy: { number: "asc" } },
      movimientos: { orderBy: { eventDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    usuarios: usuariosRocaTemporal.filter((user) => user.activo),
    registros: rows.map(toRegistro),
  };
}

export async function createReporteAcciones(userId: string | undefined, data: ReporteAccionesData) {
  validateReporte(data);
  validateAcciones(data.acciones);

  const actor = getActor(userId);
  const selectedLeader = data.liderProcesoId
    ? usuariosRocaTemporal.find((user) => user.id === data.liderProcesoId && user.rol === "Líder de proceso" && user.activo)
    : actor.rol === "Líder de proceso"
      ? actor
      : null;
  if (!selectedLeader) throw new Error("Selecciona el líder del proceso responsable del reporte.");
  const formato = formatosPorEmpresa[empresaActiva];
  const now = new Date();
  const sendsDirectlyToQuality = actor.rol === "Líder de proceso" && selectedLeader.id === actor.id;
  const initialStatus: ReporteEstado = sendsDirectlyToQuality ? "En revisión de Calidad" : "Pendiente aprobación líder";
  const initialResponsible = sendsDirectlyToQuality ? "Gestión de Calidad" : selectedLeader.nombre;
  const createdId = await prisma.$transaction(async (tx) => {
    const row = await tx.registroReporteAcciones.create({
      data: {
        company: empresaActiva,
        formatCode: formato.codigo,
        formatVersion: formato.version,
        formatName: data.nombre,
        formatProcess: data.procesoFormato,
        formatDate: data.fechaFormato,
        leaderName: selectedLeader.nombre,
        leaderUserId: selectedLeader.id,
        creatorUserId: actor.id,
        creatorName: actor.nombre,
        process: data.proceso,
        findingDate: data.fechaHallazgo,
        findingType: data.tipoHallazgo,
        source: data.fuente,
        findingDescription: data.descripcionHallazgo,
        causes: data.causas,
        problemDescription: data.descripcionProblema,
        analysisMethodology: data.metodologiaAnalisis,
        identifiedCauses: data.causasIdentificadas,
        rootCause: data.causaRaiz,
        analysisObservations: data.observacionesAnalisis,
        consequences: data.consecuencias,
        risksOpportunities: data.riesgosOportunidades,
        status: initialStatus,
        currentResponsible: initialResponsible,
        effectivenessFollowupDate: data.fechaSeguimientoEficacia || null,
        effectivenessResponsible: data.responsableValidarEficacia || null,
        qualityObservations: data.observacionesCalidad || null,
      },
    });
    const consecutivo = formatConsecutivo(row.numero);

    await tx.registroReporteAcciones.update({ where: { id: row.id }, data: { consecutivo } });
    await tx.accionReporteAcciones.createMany({ data: actionCreateRows(row.id, data.acciones) });
    await tx.movimientoReporteAcciones.create({
      data: {
        reportId: row.id,
        clientId: `${row.id}-creacion`,
        type: "HISTORIAL",
        eventDate: now,
        userName: actor.nombre,
        role: actor.rol,
        action: sendsDirectlyToQuality ? "Creó y envió el reporte a Calidad" : "Creó y envió el reporte al líder",
        fromStatus: "Borrador",
        toStatus: initialStatus,
        observation: sendsDirectlyToQuality
          ? "Reporte enviado para revisión inicial de Calidad."
          : `Reporte enviado a ${selectedLeader.nombre} para revisión del líder del proceso.`,
      },
    });

    return row.id;
  });

  return toRegistro((await findReport(createdId))!);
}

export async function updateReporteAcciones(registro: ReporteAccionesRegistro) {
  if (!registro?.id) throw new Error("El reporte no existe.");
  validateAcciones(registro.detalle.acciones);

  await prisma.$transaction(async (tx) => {
    const current = await tx.registroReporteAcciones.findUnique({ where: { id: registro.id } });
    if (!current) throw new Error("El reporte ya no existe en la base de datos.");
    validateWorkflowTransition(current.status, registro);

    await tx.accionReporteAcciones.deleteMany({ where: { reportId: registro.id } });
    await tx.movimientoReporteAcciones.deleteMany({ where: { reportId: registro.id } });
    await tx.registroReporteAcciones.update({
      where: { id: registro.id },
      data: reportUpdateData(registro),
    });
    await tx.accionReporteAcciones.createMany({ data: actionCreateRows(registro.id, registro.detalle.acciones) });
    const movimientos = [
      ...historyMovementRows(registro.id, registro.detalle.historial),
      ...reviewMovementRows(registro.id, registro.detalle.revisiones),
    ];
    if (movimientos.length) await tx.movimientoReporteAcciones.createMany({ data: movimientos });
  });

  return toRegistro((await findReport(registro.id))!);
}

export function getReporteAccionesDefaults() {
  return {
    empresaActiva,
    formato: formatosPorEmpresa[empresaActiva],
    fechaHoy: dateOnly(new Date()),
  };
}
