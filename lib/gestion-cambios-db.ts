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
  GESTION_CALIDAD: "Gestión de Calidad",
  GERENCIA_ADMINISTRATIVA: "Gerencia Administrativa",
  LIDER_PROCESO: "Líder de Proceso",
  APROBADOR_ADICIONAL: "Aprobador adicional",
};

const validRoles = new Set<GestionCambioRol>(Object.keys(roleLabels) as GestionCambioRol[]);
const validCompanies = new Set(["Dromos", "Incominería", "Ingestrac", "Drominc"]);

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

function toUser(row: {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  process: string | null;
  active: boolean;
}): UsuarioGestionCambio {
  if (!isRole(row.role) || !validCompanies.has(row.company)) {
    throw new Error(`El usuario ${row.email} tiene una configuración no compatible.`);
  }
  return {
    id: row.id,
    nombre: row.name,
    correo: row.email,
    empresa: row.company as UsuarioGestionCambio["empresa"],
    rol: row.role,
    proceso: row.process ?? undefined,
    activo: row.active,
  };
}

type ChangeRow = Awaited<ReturnType<typeof findChange>>;

async function findChange(id: string) {
  return prisma.changeRequest.findUnique({
    where: { id },
    include: {
      approvals: { orderBy: { createdAt: "desc" }, take: 1 },
      followups: { orderBy: { createdAt: "desc" }, take: 1 },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
}

function toChange(row: NonNullable<ChangeRow>): GestionCambio {
  const approval = row.approvals[0];
  const followup = row.followups[0];
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
    aprobacion: approval
      ? {
          aprobado: approval.approved ? "SI" : "NO",
          nombre: approval.approverName,
          cargo: approval.position ?? "",
          fecha: dateOnly(approval.approvedAt) ?? "",
          observaciones: approval.observations ?? "",
          firma: approval.signature ?? undefined,
          rolAprobador: approval.approverRole as GestionCambioRol,
        }
      : undefined,
    seguimiento: followup
      ? {
          cambioEficaz: followup.effective ? "SI" : "NO",
          observaciones: followup.observations ?? "",
          acciones: followup.actions ?? "",
          nombreCierre: followup.responsibleName,
          cargoCierre: followup.position ?? "",
          fechaSeguimiento: dateOnly(followup.followupAt) ?? "",
          fechaCierre: dateOnly(followup.closedAt) ?? "",
        }
      : undefined,
    historial: row.history.map((entry) => ({
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
  const actor = await prisma.user.findFirst({ where: { id: userId, active: true } });
  if (!actor || !isRole(actor.role)) throw new Error("El usuario activo ya no está disponible.");
  return actor;
}

function historyEntry(
  requestId: string,
  actor: Awaited<ReturnType<typeof getActor>>,
  action: GestionCambioWorkflowAction,
  fromState: string | null,
  toState: string,
  observation: string,
  approver?: Awaited<ReturnType<typeof prisma.user.findUnique>>,
) {
  return {
    changeRequestId: requestId,
    fromState,
    toState,
    action,
    userId: actor.id,
    userName: actor.name,
    role: actor.role,
    position: roleLabels[actor.role as GestionCambioRol],
    observation,
    selectedApproverId: approver?.id,
    selectedApproverName: approver?.name,
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

export async function getGestionCambiosData() {
  const [userRows, changeRows] = await Promise.all([
    prisma.user.findMany({ where: { active: true }, orderBy: [{ company: "asc" }, { name: "asc" }] }),
    prisma.changeRequest.findMany({
      include: {
        approvals: { orderBy: { createdAt: "desc" }, take: 1 },
        followups: { orderBy: { createdAt: "desc" }, take: 1 },
        history: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    usuarios: userRows.map(toUser),
    registros: changeRows.map(toChange),
  };
}

export async function createChange(userId: string, data: SolicitudCambioData, intent: "draft" | "send-quality") {
  validateRequest(data);
  const actor = await getActor(userId);
  if (actor.company !== data.empresa) throw new Error("No puedes crear registros para otra empresa.");

  const quality = await prisma.user.findFirst({
    where: { company: data.empresa, role: "GESTION_CALIDAD", active: true },
  });
  if (intent === "send-quality" && !quality) throw new Error("Configura un responsable de Gestión de Calidad antes de enviar.");

  const leader = data.liderProcesoId
    ? await prisma.user.findFirst({ where: { id: data.liderProcesoId, company: data.empresa, active: true } })
    : actor;
  const leaderName = data.liderProceso?.trim() || leader?.name || actor.name;
  const state = intent === "send-quality" ? "EN_REVISION_CALIDAD" : "BORRADOR";

  const createdId = await prisma.$transaction(async (tx) => {
    const counterKey = `gestion-cambios-${new Date().getFullYear()}`;
    const counter = await tx.appCounter.upsert({
      where: { key: counterKey },
      create: { key: counterKey, value: 1 },
      update: { value: { increment: 1 } },
    });
    const code = `GC-${new Date().getFullYear()}-${String(counter.value).padStart(3, "0")}`;
    const request = await tx.changeRequest.create({
      data: {
        code,
        company: data.empresa,
        process: data.proceso.trim(),
        leaderUserId: leader?.id,
        leaderName,
        creatorUserId: actor.id,
        creatorName: actor.name,
        currentState: state,
        currentResponsibleRole: state === "BORRADOR" ? "LIDER_PROCESO" : "GESTION_CALIDAD",
        currentResponsibleId: state === "BORRADOR" ? leader?.id : quality?.id,
        currentResponsibleName: state === "BORRADOR" ? leaderName : quality?.name,
        changeTypes: JSON.stringify(data.tiposCambio),
        analysis: JSON.stringify(data.analisis),
        implementationPlan: JSON.stringify(data.plan),
      },
    });
    await tx.changeHistory.create({
      data: historyEntry(
        request.id,
        actor,
        "CREAR_REGISTRO",
        null,
        "BORRADOR",
        "El usuario crea el registro SIG-F006 en borrador.",
      ),
    });
    if (state === "EN_REVISION_CALIDAD") {
      await tx.changeHistory.create({
        data: historyEntry(
          request.id,
          actor,
          "ENVIAR_CALIDAD",
          "BORRADOR",
          state,
          "El usuario diligencia el SIG-F006 y lo envía a Gestión de Calidad para revisión inicial.",
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
  const [actor, current] = await Promise.all([getActor(userId), prisma.changeRequest.findUnique({ where: { id } })]);
  if (!current) throw new Error("La gestión de cambio ya no existe.");
  if (current.creatorUserId !== actor.id && current.leaderUserId !== actor.id) throw new Error("No tienes permiso para editar este registro.");
  if (!["BORRADOR", "DEVUELTO_LIDER", "RECHAZADO_APROBADOR"].includes(current.currentState)) {
    throw new Error("El registro cambió de estado y ya no admite edición.");
  }

  const quality =
    intent === "send-quality"
      ? await prisma.user.findFirst({ where: { company: current.company, role: "GESTION_CALIDAD", active: true } })
      : null;
  if (intent === "send-quality" && !quality) throw new Error("Configura un responsable de Gestión de Calidad antes de enviar.");
  const nextState = intent === "send-quality" ? "EN_REVISION_CALIDAD" : current.currentState;
  const action: GestionCambioWorkflowAction = intent === "send-quality" ? "REENVIAR_CALIDAD" : "GUARDAR_BORRADOR";

  await prisma.$transaction(async (tx) => {
    await tx.changeRequest.update({
      where: { id },
      data: {
        process: data.proceso.trim(),
        leaderUserId: data.liderProcesoId ?? current.leaderUserId,
        leaderName: data.liderProceso?.trim() || current.leaderName,
        currentState: nextState,
        currentResponsibleRole: intent === "send-quality" ? "GESTION_CALIDAD" : current.currentResponsibleRole,
        currentResponsibleId: intent === "send-quality" ? quality?.id : current.currentResponsibleId,
        currentResponsibleName: intent === "send-quality" ? quality?.name : current.currentResponsibleName,
        changeTypes: JSON.stringify(data.tiposCambio),
        analysis: JSON.stringify(data.analisis),
        implementationPlan: JSON.stringify(data.plan),
        correctionNotes: intent === "send-quality" ? null : current.correctionNotes,
      },
    });
    await tx.changeHistory.create({
      data: historyEntry(
        id,
        actor,
        action,
        current.currentState,
        nextState,
        intent === "send-quality"
          ? "El líder corrige el SIG-F006 y lo reenvía a Gestión de Calidad."
          : "El usuario guarda los cambios del borrador SIG-F006.",
      ),
    });
  });

  return toChange((await findChange(id))!);
}

export async function applyWorkflow(id: string, userId: string, action: GestionCambioWorkflowAction, payload: WorkflowPayload = {}) {
  const [actor, current] = await Promise.all([getActor(userId), prisma.changeRequest.findUnique({ where: { id } })]);
  if (!current) throw new Error("La gestión de cambio ya no existe.");
  if (actor.company !== current.company) throw new Error("No puedes gestionar registros de otra empresa.");

  const expected: Partial<Record<GestionCambioWorkflowAction, string>> = {
    SOLICITAR_CORRECCION: "EN_REVISION_CALIDAD",
    VALIDAR_REMITIR: "EN_REVISION_CALIDAD",
    REGISTRAR_APROBACION: "PENDIENTE_APROBACION",
    REGISTRAR_RECHAZO: "PENDIENTE_APROBACION",
    CERRAR_FORMATO: "EN_SEGUIMIENTO_CALIDAD",
  };
  if (expected[action] !== current.currentState) throw new Error("El registro cambió de estado. Actualiza la página e inténtalo nuevamente.");

  if (["SOLICITAR_CORRECCION", "VALIDAR_REMITIR", "CERRAR_FORMATO"].includes(action) && actor.role !== "GESTION_CALIDAD") {
    throw new Error("Esta acción corresponde a Gestión de Calidad.");
  }
  if (["REGISTRAR_APROBACION", "REGISTRAR_RECHAZO"].includes(action) && current.currentResponsibleId !== actor.id) {
    throw new Error("Este registro está asignado a otro aprobador.");
  }

  await prisma.$transaction(async (tx) => {
    if (action === "SOLICITAR_CORRECCION") {
      const observation = required(payload.observacionesCorreccion, "La observación de corrección");
      await tx.changeRequest.update({
        where: { id },
        data: {
          currentState: "DEVUELTO_LIDER",
          currentResponsibleRole: "LIDER_PROCESO",
          currentResponsibleId: current.leaderUserId,
          currentResponsibleName: current.leaderName,
          correctionNotes: observation,
        },
      });
      await tx.changeHistory.create({ data: historyEntry(id, actor, action, current.currentState, "DEVUELTO_LIDER", observation) });
      return;
    }

    if (action === "VALIDAR_REMITIR") {
      const approverId = required(payload.aprobadorSeleccionadoId, "El aprobador");
      const approver = await tx.user.findFirst({
        where: { id: approverId, company: current.company, active: true, role: { in: ["GERENCIA_ADMINISTRATIVA", "APROBADOR_ADICIONAL"] } },
      });
      if (!approver) throw new Error("El aprobador seleccionado no está disponible.");
      const observation = required(payload.validacionCalidad, "La validación de Calidad");
      await tx.changeRequest.update({
        where: { id },
        data: {
          currentState: "PENDIENTE_APROBACION",
          currentResponsibleRole: approver.role,
          currentResponsibleId: approver.id,
          currentResponsibleName: approver.name,
          selectedApproverId: approver.id,
          selectedApproverName: approver.name,
          selectedApproverRole: approver.role,
          qualityValidation: observation,
          correctionNotes: null,
        },
      });
      await tx.changeHistory.create({
        data: historyEntry(id, actor, action, current.currentState, "PENDIENTE_APROBACION", observation, approver),
      });
      return;
    }

    if (action === "REGISTRAR_APROBACION" || action === "REGISTRAR_RECHAZO") {
      const approval = payload.aprobacion;
      if (!approval) throw new Error("Completa la decisión de aprobación.");
      required(approval.nombre, "El nombre del aprobador");
      required(approval.cargo, "El cargo");
      required(approval.observaciones, "Las observaciones");
      required(approval.firma, "La firma");
      const approved = action === "REGISTRAR_APROBACION";
      const now = new Date();
      const closeDueAt = new Date(now);
      closeDueAt.setMonth(closeDueAt.getMonth() + 3);
      const quality = await tx.user.findFirst({ where: { company: current.company, role: "GESTION_CALIDAD", active: true } });
      if (approved && !quality) throw new Error("No hay un responsable activo de Gestión de Calidad para el seguimiento.");
      await tx.changeApproval.create({
        data: {
          changeRequestId: id,
          approverUserId: actor.id,
          approverName: actor.name,
          approverRole: actor.role,
          approved,
          position: approval.cargo.trim(),
          observations: approval.observaciones.trim(),
          signature: approval.firma,
          approvedAt: now,
        },
      });
      const nextState = approved ? "EN_SEGUIMIENTO_CALIDAD" : "RECHAZADO_APROBADOR";
      await tx.changeRequest.update({
        where: { id },
        data: approved
          ? {
              currentState: nextState,
              currentResponsibleRole: "GESTION_CALIDAD",
              currentResponsibleId: quality?.id,
              currentResponsibleName: quality?.name,
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
      await tx.changeHistory.create({
        data: historyEntry(id, actor, action, current.currentState, nextState, approval.observaciones.trim()),
      });
      return;
    }

    if (action === "CERRAR_FORMATO") {
      const followup = payload.seguimiento;
      if (!followup) throw new Error("Completa el seguimiento antes de cerrar.");
      required(followup.nombreCierre, "El nombre de quien cierra");
      required(followup.cargoCierre, "El cargo de quien cierra");
      required(followup.acciones, "Las acciones de seguimiento");
      if (!followup.cambioEficaz) throw new Error("Indica si el cambio fue eficaz.");
      const now = new Date();
      await tx.changeFollowup.create({
        data: {
          changeRequestId: id,
          responsibleUserId: actor.id,
          responsibleName: actor.name,
          effective: followup.cambioEficaz === "SI",
          observations: followup.observaciones.trim(),
          actions: followup.acciones.trim(),
          position: followup.cargoCierre.trim(),
          followupAt: now,
          closedAt: now,
        },
      });
      await tx.changeRequest.update({ where: { id }, data: { currentState: "CERRADO", closedAt: now } });
      await tx.changeHistory.create({
        data: historyEntry(id, actor, action, current.currentState, "CERRADO", followup.observaciones.trim() || "Calidad cierra el formato SIG-F006."),
      });
      return;
    }

    throw new Error("La acción solicitada no está habilitada.");
  });

  return toChange((await findChange(id))!);
}

export async function createUser(input: Omit<UsuarioGestionCambio, "id" | "activo">) {
  if (!validCompanies.has(input.empresa) || !validRoles.has(input.rol)) throw new Error("La empresa o el rol no son válidos.");
  const user = await prisma.user.create({
    data: {
      name: required(input.nombre, "El nombre"),
      email: required(input.correo, "El correo").toLowerCase(),
      company: input.empresa,
      role: input.rol,
      process: input.proceso?.trim() || null,
      active: true,
    },
  });
  return toUser(user);
}

export async function deactivateUser(id: string) {
  const assigned = await prisma.changeRequest.count({
    where: {
      OR: [{ creatorUserId: id }, { leaderUserId: id }, { currentResponsibleId: id }, { selectedApproverId: id }],
      currentState: { not: "CERRADO" },
    },
  });
  if (assigned > 0) throw new Error("No puedes desactivar este usuario porque tiene gestiones abiertas asignadas.");
  await prisma.user.update({ where: { id }, data: { active: false } });
}
