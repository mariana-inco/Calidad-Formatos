import type {
  AprobacionCambioData,
  GestionCambio,
  GestionCambioEstado,
  GestionCambioRol,
  GestionCambioWorkflowAction,
  SeguimientoCambioData,
  SolicitudCambioData,
  UsuarioGestionCambio,
} from "@/app/gestion-cambios/components/types";
import { prisma } from "./prisma";

const roleLabels: Record<GestionCambioRol, string> = {
  COLABORADOR: "Colaborador",
  GESTION_CALIDAD: "Gestión de Calidad",
  GERENCIA_ADMINISTRATIVA: "Gerencia Administrativa",
  LIDER_PROCESO: "Líder de Proceso",
  APROBADOR_ADICIONAL: "Aprobador adicional",
};

const validRoles = new Set<GestionCambioRol>(Object.keys(roleLabels) as GestionCambioRol[]);
const validCompanies = new Set(["Dromos", "Incominería", "Ingestrac", "Drominc"]);

const usuariosRocaTemporal: UsuarioGestionCambio[] = [
  {
    id: "cmrdjjl380000xkm4umbn8068",
    nombre: "steven",
    correo: "steven.amado@incomineria.co",
    empresa: "Incominería",
    rol: "COLABORADOR",
    cargo: "Colaborador",
    activo: true,
  },
  {
    id: "cmrdjk8k00001xkm4czvo26vo",
    nombre: "alexis",
    correo: "alexis@incomineria.co",
    empresa: "Incominería",
    rol: "GESTION_CALIDAD",
    cargo: "Gestión de Calidad",
    activo: true,
  },
  {
    id: "cmrdjklbs0002xkm46nzo7fh9",
    nombre: "sandra",
    correo: "sandra.marin@incomineria.co",
    empresa: "Incominería",
    rol: "GERENCIA_ADMINISTRATIVA",
    cargo: "Gerencia Administrativa",
    activo: true,
  },
  {
    id: "cmrdjkx3k0003xkm4lio3guza",
    nombre: "eduardo santos",
    correo: "eduardo.santos@dromos.co",
    empresa: "Incominería",
    rol: "LIDER_PROCESO",
    cargo: "Líder de Proceso",
    activo: true,
  },
  {
    id: "cmrdjl9ml0004xkm4rrwd0ivd",
    nombre: "mariana gomez",
    correo: "mariana.gomez@incomineria.co",
    empresa: "Incominería",
    rol: "APROBADOR_ADICIONAL",
    cargo: "Aprobador adicional",
    activo: true,
  },
];

type WorkflowPayload = {
  observacionesCorreccion?: string;
  validacionCalidad?: string;
  aprobadorSeleccionadoId?: string;
  aprobacion?: AprobacionCambioData;
  seguimiento?: SeguimientoCambioData;
};

function required(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }
  return value.trim();
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function dateOnly(value?: Date | null) {
  return value?.toISOString().slice(0, 10);
}

function isRole(value: string | null): value is GestionCambioRol {
  return Boolean(value && validRoles.has(value as GestionCambioRol));
}

function toUser(row: UsuarioGestionCambio): UsuarioGestionCambio {
  if (!isRole(row.rol) || !validCompanies.has(row.empresa)) {
    throw new Error(`El usuario ${row.correo} tiene una configuración no compatible.`);
  }
  return row;
}

function findUserById(id?: string | null) {
  return usuariosRocaTemporal.find((user) => user.id === id && user.activo) ?? null;
}

function findUser(where: Partial<Pick<UsuarioGestionCambio, "id" | "empresa" | "rol">>) {
  return (
    usuariosRocaTemporal.find((user) => {
      if (!user.activo) return false;
      if (where.id && user.id !== where.id) return false;
      if (where.empresa && user.empresa !== where.empresa) return false;
      if (where.rol && user.rol !== where.rol) return false;
      return true;
    }) ?? null
  );
}

function findApprover(id: string, company: string) {
  return (
    usuariosRocaTemporal.find(
      (user) =>
        user.id === id &&
        user.empresa === company &&
        user.activo &&
        (user.rol === "GERENCIA_ADMINISTRATIVA" || user.rol === "APROBADOR_ADICIONAL"),
    ) ?? null
  );
}

type ChangeRow = Awaited<ReturnType<typeof findChange>>;

async function findChange(id: string) {
  return prisma.registroGestionCambio.findUnique({
    where: { id },
    include: {
      movimientos: { orderBy: { createdAt: "asc" } },
    },
  });
}

function toChange(row: NonNullable<ChangeRow>): GestionCambio {
  const approvals = row.movimientos.filter((movement) => movement.type === "APROBACION").map((approval) => ({
    aprobado: approval.approved ? ("SI" as const) : ("NO" as const),
    nombre: approval.userName,
    cargo: approval.position ?? "",
    fecha: dateOnly(approval.createdAt) ?? "",
    observaciones: approval.observation ?? "",
    firma: approval.signature ?? undefined,
    rolAprobador: approval.role as GestionCambioRol,
  }));
  const approval = approvals.at(-1);
  const followup = row.movimientos.filter((movement) => movement.type === "SEGUIMIENTO").at(-1);
  const changeTypes = parseJson<string[]>(row.changeTypes, []);
  const detalle: SolicitudCambioData = {
    empresa: row.company as SolicitudCambioData["empresa"],
    liderProceso: row.leaderName,
    liderProcesoId: row.leaderUserId ?? undefined,
    proceso: row.process,
    tiposCambio: changeTypes,
    aprobadorSeleccionadoId: row.selectedApproverId ?? undefined,
    analisis: parseJson<Record<string, string>>(row.analysis, {}),
    plan: parseJson<SolicitudCambioData["plan"]>(row.implementationPlan, []),
  };

  return {
    id: row.id,
    codigo: row.code,
    fecha: dateOnly(row.createdAt) ?? "",
    fechaHora: row.createdAt.toISOString(),
    empresa: detalle.empresa,
    liderProceso: row.leaderName,
    liderProcesoId: row.leaderUserId ?? undefined,
    proceso: row.process,
    tipoCambio: changeTypes.join(", "),
    estado: row.currentState as GestionCambioEstado,
    responsableActual: row.currentResponsibleRole as GestionCambioRol,
    responsableActualId: row.currentResponsibleId ?? undefined,
    responsableActualNombre: row.currentResponsibleName ?? undefined,
    creadorId: row.creatorUserId,
    creadorNombre: row.creatorName,
    aprobadorSeleccionadoId: row.selectedApproverId ?? undefined,
    aprobadorSeleccionadoNombre: row.selectedApproverName ?? undefined,
    aprobadorSeleccionadoRol: isRole(row.selectedApproverRole) ? row.selectedApproverRole : undefined,
    validacionCalidad: row.qualityValidation ?? undefined,
    observacionesCorreccion: row.correctionNotes ?? undefined,
    fechaAprobacion: dateOnly(row.approvedAt),
    fechaInicioSeguimiento: dateOnly(row.followupStartedAt),
    fechaLimiteCierre: dateOnly(row.closeDueAt),
    fechaCierre: dateOnly(row.closedAt),
    aprobacion: approval,
    aprobaciones: approvals,
    seguimiento: followup
      ? {
          cambioEficaz: followup.effective ? "SI" : "NO",
          observaciones: followup.observation ?? "",
          acciones: followup.followupActions ?? "",
          nombreCierre: followup.userName,
          cargoCierre: followup.position ?? "",
          fechaSeguimiento: dateOnly(followup.createdAt) ?? "",
          fechaCierre: dateOnly(row.closedAt) ?? "",
        }
      : undefined,
    historial: row.movimientos.map((entry) => ({
      accion: entry.action as GestionCambioWorkflowAction,
      fecha: entry.createdAt.toISOString(),
      usuarioId: entry.userId ?? undefined,
      usuario: entry.userName,
      rol: isRole(entry.role) ? entry.role : undefined,
      cargo: entry.position ?? undefined,
      estadoAnterior: entry.fromState as GestionCambioEstado | undefined,
      estadoNuevo: entry.toState as GestionCambioEstado,
      observaciones: entry.observation ?? undefined,
      aprobadorSeleccionadoId: entry.selectedApproverId ?? undefined,
      aprobadorSeleccionadoNombre: entry.selectedApproverName ?? undefined,
    })),
    detalle,
  };
}

async function getActor(userId: string) {
  const actor = findUserById(userId);
  if (!actor || !isRole(actor.rol)) throw new Error("El usuario activo ya no está disponible.");
  return actor;
}

function historyEntry(
  requestId: string,
  actor: Awaited<ReturnType<typeof getActor>>,
  action: GestionCambioWorkflowAction,
  fromState: string | null,
  toState: string,
  observation: string,
  approver?: UsuarioGestionCambio | null,
  extra?: {
    type?: "HISTORIAL" | "APROBACION" | "SEGUIMIENTO";
    approved?: boolean;
    effective?: boolean;
    followupActions?: string;
  },
) {
  return {
    changeRequestId: requestId,
    type: extra?.type ?? "HISTORIAL",
    fromState,
    toState,
    action,
    userId: actor.id,
    userName: actor.nombre,
    role: actor.rol,
    position: actor.cargo ?? roleLabels[actor.rol],
    observation,
    selectedApproverId: approver?.id,
    selectedApproverName: approver?.nombre,
    selectedApproverRole: approver?.rol,
    approved: extra?.approved,
    effective: extra?.effective,
    followupActions: extra?.followupActions,
  };
}

function validateRequest(data: SolicitudCambioData) {
  if (!validCompanies.has(data.empresa)) throw new Error("La empresa seleccionada no es válida.");
  required(data.proceso, "El proceso");
  if (!Array.isArray(data.tiposCambio) || data.tiposCambio.length === 0) {
    throw new Error("Selecciona al menos un tipo de cambio.");
  }
  if (!data.analisis || typeof data.analisis !== "object") throw new Error("El análisis del cambio no es válido.");
  if (!Array.isArray(data.plan)) throw new Error("El plan de implementación no es válido.");
}

function validateImplementationPlan(data: SolicitudCambioData) {
  if (data.plan.length === 0) {
    throw new Error("Agrega al menos una actividad al plan de implementación.");
  }
  const invalidActivity = data.plan.find(
    (activity) =>
      !activity.actividades?.trim() ||
      !activity.responsableId ||
      !activity.responsable?.trim() ||
      !activity.fecha,
  );
  if (invalidActivity) {
    throw new Error("Todas las actividades deben tener descripción, usuario responsable y fecha.");
  }
}

export async function getGestionCambiosData() {
  const changeRows = await prisma.registroGestionCambio.findMany({
    include: {
      movimientos: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    usuarios: usuariosRocaTemporal.filter((user) => user.activo).map(toUser),
    registros: changeRows.map(toChange),
  };
}

export async function createChange(userId: string, data: SolicitudCambioData, intent: "draft" | "send-quality") {
  validateRequest(data);
  if (intent === "send-quality") validateImplementationPlan(data);
  const actor = await getActor(userId);
  if (actor.empresa !== data.empresa) throw new Error("No puedes crear registros para otra empresa.");

  const quality = findUser({ empresa: data.empresa, rol: "GESTION_CALIDAD" });
  if (intent === "send-quality" && !quality) throw new Error("Configura un responsable de Gestión de Calidad antes de enviar.");

  const leader = data.liderProcesoId
    ? findUser({ id: data.liderProcesoId, empresa: data.empresa, rol: "LIDER_PROCESO" })
    : actor.rol === "LIDER_PROCESO"
      ? actor
      : null;
  if (intent === "send-quality" && !leader) {
    throw new Error("Selecciona el líder del proceso antes de enviar el registro a Calidad.");
  }
  const leaderName = leader?.nombre ?? "Pendiente por asignar";
  const shouldSendDirectlyToQuality = intent === "send-quality" && actor.rol === "LIDER_PROCESO" && leader?.id === actor.id;
  const state = intent === "send-quality" ? (shouldSendDirectlyToQuality ? "EN_REVISION_CALIDAD" : "PENDIENTE_APROBACION_LIDER") : "BORRADOR";

  const createdId = await prisma.$transaction(async (tx) => {
    const [{ nextNumber }] = await tx.$queryRaw<{ nextNumber: number }[]>`SELECT nextval('secuencia_codigo_gestion_cambios')::int AS "nextNumber"`;
    const code = `GC-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`;
    const request = await tx.registroGestionCambio.create({
      data: {
        numero: nextNumber,
        code,
        company: data.empresa,
        process: data.proceso.trim(),
        leaderUserId: leader?.id,
        leaderName,
        creatorUserId: actor.id,
        creatorName: actor.nombre,
        currentState: state,
        currentResponsibleRole: state === "BORRADOR" ? actor.rol : shouldSendDirectlyToQuality ? "GESTION_CALIDAD" : "LIDER_PROCESO",
        currentResponsibleId: state === "BORRADOR" ? actor.id : shouldSendDirectlyToQuality ? quality?.id : leader?.id,
        currentResponsibleName: state === "BORRADOR" ? actor.nombre : shouldSendDirectlyToQuality ? quality?.nombre : leader?.nombre,
        changeTypes: JSON.stringify(data.tiposCambio),
        analysis: JSON.stringify(data.analisis),
        implementationPlan: JSON.stringify(data.plan),
      },
    });
    await tx.movimientoGestionCambio.create({
      data: historyEntry(
        request.id,
        actor,
        "CREAR_REGISTRO",
        null,
        "BORRADOR",
        "El usuario crea el registro SIG-F006 en borrador.",
      ),
    });
    if (state !== "BORRADOR") {
      await tx.movimientoGestionCambio.create({
        data: historyEntry(
          request.id,
          actor,
          shouldSendDirectlyToQuality ? "ENVIAR_CALIDAD" : "ENVIAR_LIDER",
          "BORRADOR",
          state,
          shouldSendDirectlyToQuality
            ? "El líder del proceso crea el SIG-F006 y lo envía directamente a Gestión de Calidad."
            : `El creador diligencia el SIG-F006 y lo envía a ${leader?.nombre} para aprobación del líder del proceso.`,
        ),
      });
    }
    return request.id;
  });

  return toChange((await findChange(createdId))!);
}

export async function updateChange(
  id: string,
  userId: string,
  data: SolicitudCambioData,
  intent: "draft" | "send-quality",
) {
  validateRequest(data);
  if (intent === "send-quality") validateImplementationPlan(data);
  const [actor, current] = await Promise.all([getActor(userId), prisma.registroGestionCambio.findUnique({ where: { id } })]);
  if (!current) throw new Error("La gestión de cambio ya no existe.");
  if (current.creatorUserId !== actor.id && current.leaderUserId !== actor.id) throw new Error("No tienes permiso para editar este registro.");
  if (!["BORRADOR", "DEVUELTO_LIDER", "RECHAZADO_LIDER", "RECHAZADO_APROBADOR"].includes(current.currentState)) {
    throw new Error("El registro cambió de estado y ya no admite edición.");
  }

  const quality =
    intent === "send-quality"
      ? findUser({ empresa: current.company as UsuarioGestionCambio["empresa"], rol: "GESTION_CALIDAD" })
      : null;
  if (intent === "send-quality" && !quality) throw new Error("Configura un responsable de Gestión de Calidad antes de enviar.");
  const leaderId = data.liderProcesoId ?? current.leaderUserId ?? (actor.rol === "LIDER_PROCESO" ? actor.id : undefined);
  const leader = leaderId
    ? findUser({ id: leaderId, empresa: current.company as UsuarioGestionCambio["empresa"], rol: "LIDER_PROCESO" })
    : null;
  if (intent === "send-quality" && !leader) {
    throw new Error("Selecciona el líder del proceso antes de enviar el registro a Calidad.");
  }
  const returnsToQuality = current.currentState === "DEVUELTO_LIDER";
  const shouldSendDirectlyToQuality = intent === "send-quality" && !returnsToQuality && actor.rol === "LIDER_PROCESO" && leader?.id === actor.id;
  const nextState =
    intent === "send-quality"
      ? returnsToQuality
        ? "EN_REVISION_CALIDAD"
        : shouldSendDirectlyToQuality
          ? "EN_REVISION_CALIDAD"
          : "PENDIENTE_APROBACION_LIDER"
      : current.currentState;
  const action: GestionCambioWorkflowAction =
    intent === "send-quality" ? (returnsToQuality ? "REENVIAR_CALIDAD" : shouldSendDirectlyToQuality ? "ENVIAR_CALIDAD" : "ENVIAR_LIDER") : "GUARDAR_BORRADOR";

  await prisma.$transaction(async (tx) => {
    await tx.registroGestionCambio.update({
      where: { id },
      data: {
        process: data.proceso.trim(),
        leaderUserId: leader?.id ?? null,
        leaderName: leader?.nombre ?? "Pendiente por asignar",
        currentState: nextState,
        currentResponsibleRole: intent === "send-quality" ? (returnsToQuality || shouldSendDirectlyToQuality ? "GESTION_CALIDAD" : "LIDER_PROCESO") : current.currentResponsibleRole,
        currentResponsibleId: intent === "send-quality" ? (returnsToQuality || shouldSendDirectlyToQuality ? quality?.id : leader?.id) : current.currentResponsibleId,
        currentResponsibleName: intent === "send-quality" ? (returnsToQuality || shouldSendDirectlyToQuality ? quality?.nombre : leader?.nombre) : current.currentResponsibleName,
        changeTypes: JSON.stringify(data.tiposCambio),
        analysis: JSON.stringify(data.analisis),
        implementationPlan: JSON.stringify(data.plan),
        correctionNotes: intent === "send-quality" ? null : current.correctionNotes,
      },
    });
    await tx.movimientoGestionCambio.create({
      data: historyEntry(
        id,
        actor,
        action,
        current.currentState,
        nextState,
        intent === "send-quality"
          ? returnsToQuality
            ? "El creador o líder responsable corrige el SIG-F006 y lo reenvía a Gestión de Calidad."
            : shouldSendDirectlyToQuality
              ? "El líder del proceso envía el SIG-F006 directamente a Gestión de Calidad."
              : "El creador envía el SIG-F006 al líder del proceso para aprobación."
          : "El usuario guarda los cambios del borrador SIG-F006.",
      ),
    });
  });

  return toChange((await findChange(id))!);
}

export async function applyWorkflow(id: string, userId: string, action: GestionCambioWorkflowAction, payload: WorkflowPayload = {}) {
  const [actor, current] = await Promise.all([getActor(userId), prisma.registroGestionCambio.findUnique({ where: { id } })]);
  if (!current) throw new Error("La gestión de cambio ya no existe.");
  if (actor.empresa !== current.company) throw new Error("No puedes gestionar registros de otra empresa.");

  const expected: Partial<Record<GestionCambioWorkflowAction, string>> = {
    APROBAR_LIDER: "PENDIENTE_APROBACION_LIDER",
    RECHAZAR_LIDER: "PENDIENTE_APROBACION_LIDER",
    SOLICITAR_CORRECCION: "EN_REVISION_CALIDAD",
    VALIDAR_REMITIR: "EN_REVISION_CALIDAD",
    REGISTRAR_APROBACION: "PENDIENTE_APROBACION",
    REGISTRAR_RECHAZO: "PENDIENTE_APROBACION",
    CERRAR_FORMATO: "EN_SEGUIMIENTO_CALIDAD",
  };
  if (expected[action] !== current.currentState) throw new Error("El registro cambió de estado. Actualiza la página e inténtalo nuevamente.");

  if (["SOLICITAR_CORRECCION", "VALIDAR_REMITIR", "CERRAR_FORMATO"].includes(action) && actor.rol !== "GESTION_CALIDAD") {
    throw new Error("Esta acción corresponde a Gestión de Calidad.");
  }
  if (["REGISTRAR_APROBACION", "REGISTRAR_RECHAZO"].includes(action) && current.currentResponsibleId !== actor.id) {
    throw new Error("Este registro está asignado a otro aprobador.");
  }

  await prisma.$transaction(async (tx) => {
    if (action === "APROBAR_LIDER" || action === "RECHAZAR_LIDER") {
      if (actor.rol !== "LIDER_PROCESO" || current.currentResponsibleId !== actor.id) {
        throw new Error("Este registro está asignado a otro líder de proceso.");
      }
      const approval = payload.aprobacion;
      if (!approval) throw new Error("Completa la decisión del líder.");
      required(approval.observaciones, "Las observaciones");
      const approved = action === "APROBAR_LIDER";
      const quality = approved
        ? findUser({ empresa: current.company as UsuarioGestionCambio["empresa"], rol: "GESTION_CALIDAD" })
        : null;
      if (approved && !quality) throw new Error("No hay un responsable activo de Gestión de Calidad.");
      const creator = !approved ? findUserById(current.creatorUserId) : null;

      const nextState = approved ? "EN_REVISION_CALIDAD" : "RECHAZADO_LIDER";
      await tx.registroGestionCambio.update({
        where: { id },
        data: {
          currentState: nextState,
          currentResponsibleRole: approved ? "GESTION_CALIDAD" : creator?.rol ?? "COLABORADOR",
          currentResponsibleId: approved ? quality?.id : current.creatorUserId,
          currentResponsibleName: approved ? quality?.nombre : current.creatorName,
        },
      });
      await tx.movimientoGestionCambio.create({
        data: historyEntry(id, actor, action, current.currentState, nextState, approval.observaciones.trim(), null, {
          type: "APROBACION",
          approved,
        }),
      });
      return;
    }

    if (action === "SOLICITAR_CORRECCION") {
      const observation = required(payload.observacionesCorreccion, "La observación de corrección");
      await tx.registroGestionCambio.update({
        where: { id },
        data: {
          currentState: "DEVUELTO_LIDER",
          currentResponsibleRole: "LIDER_PROCESO",
          currentResponsibleId: current.leaderUserId,
          currentResponsibleName: current.leaderName,
          correctionNotes: observation,
        },
      });
      await tx.movimientoGestionCambio.create({ data: historyEntry(id, actor, action, current.currentState, "DEVUELTO_LIDER", observation) });
      return;
    }

    if (action === "VALIDAR_REMITIR") {
      const approverId = required(payload.aprobadorSeleccionadoId, "El aprobador");
      const approver = findApprover(approverId, current.company);
      if (!approver) throw new Error("El aprobador seleccionado no está disponible.");
      const observation = required(payload.validacionCalidad, "La validación de Calidad");
      await tx.registroGestionCambio.update({
        where: { id },
        data: {
          currentState: "PENDIENTE_APROBACION",
          currentResponsibleRole: approver.rol,
          currentResponsibleId: approver.id,
          currentResponsibleName: approver.nombre,
          selectedApproverId: approver.id,
          selectedApproverName: approver.nombre,
          selectedApproverRole: approver.rol,
          qualityValidation: observation,
          correctionNotes: null,
        },
      });
      await tx.movimientoGestionCambio.create({
        data: historyEntry(id, actor, action, current.currentState, "PENDIENTE_APROBACION", observation, approver, {
          type: "APROBACION",
          approved: true,
        }),
      });
      return;
    }

    if (action === "REGISTRAR_APROBACION" || action === "REGISTRAR_RECHAZO") {
      const approval = payload.aprobacion;
      if (!approval) throw new Error("Completa la decisión de aprobación.");
      required(approval.observaciones, "Las observaciones");
      const approved = action === "REGISTRAR_APROBACION";
      const now = new Date();
      const closeDueAt = new Date(now);
      closeDueAt.setMonth(closeDueAt.getMonth() + 3);
      const quality = findUser({ empresa: current.company as UsuarioGestionCambio["empresa"], rol: "GESTION_CALIDAD" });
      if (approved && !quality) throw new Error("No hay un responsable activo de Gestión de Calidad para el seguimiento.");
      const nextState = approved ? "EN_SEGUIMIENTO_CALIDAD" : "RECHAZADO_APROBADOR";
      await tx.registroGestionCambio.update({
        where: { id },
        data: approved
          ? {
              currentState: nextState,
              currentResponsibleRole: "GESTION_CALIDAD",
              currentResponsibleId: quality?.id,
              currentResponsibleName: quality?.nombre,
              approvedAt: now,
              followupStartedAt: now,
              closeDueAt,
            }
          : {
              currentState: nextState,
              currentResponsibleRole: "LIDER_PROCESO",
              currentResponsibleId: current.leaderUserId,
              currentResponsibleName: current.leaderName,
            },
      });
      await tx.movimientoGestionCambio.create({
        data: historyEntry(id, actor, action, current.currentState, nextState, approval.observaciones.trim(), null, {
          type: "APROBACION",
          approved,
        }),
      });
      return;
    }

    if (action === "CERRAR_FORMATO") {
      const followup = payload.seguimiento;
      if (!followup) throw new Error("Completa el seguimiento antes de cerrar.");
      required(followup.acciones, "Las acciones de seguimiento");
      if (!followup.cambioEficaz) throw new Error("Indica si el cambio fue eficaz.");
      if (followup.cambioEficaz !== "SI") {
        throw new Error("Un cambio no eficaz debe permanecer en seguimiento y no puede finalizarse como aprobado.");
      }
      const now = new Date();
      await tx.registroGestionCambio.update({ where: { id }, data: { currentState: "APROBADO", closedAt: now } });
      await tx.movimientoGestionCambio.create({
        data: historyEntry(
          id,
          actor,
          action,
          current.currentState,
          "APROBADO",
          followup.observaciones.trim() || "Calidad finaliza el formato SIG-F006 como aprobado.",
          null,
          {
            type: "SEGUIMIENTO",
            effective: followup.cambioEficaz === "SI",
            followupActions: followup.acciones.trim(),
          },
        ),
      });
      return;
    }

    throw new Error("La acción solicitada no está habilitada.");
  });

  return toChange((await findChange(id))!);
}

export async function createUser(input: Omit<UsuarioGestionCambio, "id" | "activo">) {
  void input;
  throw new Error("Los usuarios se administrarán desde ROCA. Esta base solo guarda registros y movimientos de Gestión de Cambios.");
}

export async function deactivateUser(id: string) {
  void id;
  throw new Error("Los usuarios se administrarán desde ROCA. Esta base solo guarda registros y movimientos de Gestión de Cambios.");
}
