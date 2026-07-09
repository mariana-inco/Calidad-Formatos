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

type WorkflowPayload = {
  observacionesCorreccion?: string;
  validacionCalidad?: string;
  firmaRevisionCalidad?: string;
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
  position: string | null;
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
    cargo: row.position ?? roleLabels[row.role],
    proceso: row.process ?? undefined,
    activo: row.active,
  };
}

type ChangeRow = Awaited<ReturnType<typeof findChange>>;

async function findChange(id: string) {
  return prisma.changeRequest.findUnique({
    where: { id },
    include: {
      approvals: { orderBy: { createdAt: "asc" } },
      followups: { orderBy: { createdAt: "desc" }, take: 1 },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
}

function toChange(row: NonNullable<ChangeRow>): GestionCambio {
  const approvals = row.approvals.map((approval) => ({
    aprobado: approval.approved ? ("SI" as const) : ("NO" as const),
    nombre: approval.approverName,
    cargo: approval.position ?? "",
    fecha: dateOnly(approval.approvedAt) ?? "",
    observaciones: approval.observations ?? "",
    firma: approval.signature ?? undefined,
    rolAprobador: approval.approverRole as GestionCambioRol,
  }));
  const approval = approvals.at(-1);
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
    aprobacion: approval,
    aprobaciones: approvals,
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
    position: actor.position ?? roleLabels[actor.role as GestionCambioRol],
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
  const [userRows, changeRows] = await Promise.all([
    prisma.user.findMany({ where: { active: true }, orderBy: [{ company: "asc" }, { name: "asc" }] }),
    prisma.changeRequest.findMany({
      include: {
        approvals: { orderBy: { createdAt: "asc" } },
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
  if (intent === "send-quality") validateImplementationPlan(data);
  const actor = await getActor(userId);
  if (actor.company !== data.empresa) throw new Error("No puedes crear registros para otra empresa.");

  const quality = await prisma.user.findFirst({
    where: { company: data.empresa, role: "GESTION_CALIDAD", active: true },
  });
  if (intent === "send-quality" && !quality) throw new Error("Configura un responsable de Gestión de Calidad antes de enviar.");

  const leader = data.liderProcesoId
    ? await prisma.user.findFirst({
        where: { id: data.liderProcesoId, company: data.empresa, role: "LIDER_PROCESO", active: true },
      })
    : actor.role === "LIDER_PROCESO"
      ? actor
      : null;
  if (intent === "send-quality" && !leader) {
    throw new Error("Selecciona el líder del proceso antes de enviar el registro a Calidad.");
  }
  const leaderName = leader?.name ?? "Pendiente por asignar";
  const state = intent === "send-quality" ? "PENDIENTE_APROBACION_LIDER" : "BORRADOR";

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
        currentResponsibleRole: state === "BORRADOR" ? actor.role : "LIDER_PROCESO",
        currentResponsibleId: state === "BORRADOR" ? actor.id : leader?.id,
        currentResponsibleName: state === "BORRADOR" ? actor.name : leader?.name,
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
    if (state === "PENDIENTE_APROBACION_LIDER") {
      await tx.changeHistory.create({
        data: historyEntry(
          request.id,
          actor,
          "ENVIAR_LIDER",
          "BORRADOR",
          state,
          `El creador diligencia el SIG-F006 y lo envía a ${leader?.name} para aprobación del líder del proceso.`,
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
  const [actor, current] = await Promise.all([getActor(userId), prisma.changeRequest.findUnique({ where: { id } })]);
  if (!current) throw new Error("La gestión de cambio ya no existe.");
  if (current.creatorUserId !== actor.id && current.leaderUserId !== actor.id) throw new Error("No tienes permiso para editar este registro.");
  if (!["BORRADOR", "DEVUELTO_LIDER", "RECHAZADO_LIDER", "RECHAZADO_APROBADOR"].includes(current.currentState)) {
    throw new Error("El registro cambió de estado y ya no admite edición.");
  }

  const quality =
    intent === "send-quality"
      ? await prisma.user.findFirst({ where: { company: current.company, role: "GESTION_CALIDAD", active: true } })
      : null;
  if (intent === "send-quality" && !quality) throw new Error("Configura un responsable de Gestión de Calidad antes de enviar.");
  const leaderId = data.liderProcesoId ?? current.leaderUserId;
  const leader = leaderId
    ? await prisma.user.findFirst({
        where: { id: leaderId, company: current.company, role: "LIDER_PROCESO", active: true },
      })
    : null;
  if (intent === "send-quality" && !leader) {
    throw new Error("Selecciona el líder del proceso antes de enviar el registro a Calidad.");
  }
  const returnsToQuality = current.currentState === "DEVUELTO_LIDER";
  const nextState =
    intent === "send-quality"
      ? returnsToQuality
        ? "EN_REVISION_CALIDAD"
        : "PENDIENTE_APROBACION_LIDER"
      : current.currentState;
  const action: GestionCambioWorkflowAction =
    intent === "send-quality" ? (returnsToQuality ? "REENVIAR_CALIDAD" : "ENVIAR_LIDER") : "GUARDAR_BORRADOR";

  await prisma.$transaction(async (tx) => {
    await tx.changeRequest.update({
      where: { id },
      data: {
        process: data.proceso.trim(),
        leaderUserId: leader?.id ?? null,
        leaderName: leader?.name ?? "Pendiente por asignar",
        currentState: nextState,
        currentResponsibleRole: intent === "send-quality" ? (returnsToQuality ? "GESTION_CALIDAD" : "LIDER_PROCESO") : current.currentResponsibleRole,
        currentResponsibleId: intent === "send-quality" ? (returnsToQuality ? quality?.id : leader?.id) : current.currentResponsibleId,
        currentResponsibleName: intent === "send-quality" ? (returnsToQuality ? quality?.name : leader?.name) : current.currentResponsibleName,
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
          ? returnsToQuality
            ? "El creador o líder responsable corrige el SIG-F006 y lo reenvía a Gestión de Calidad."
            : "El creador envía el SIG-F006 al líder del proceso para aprobación."
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
    APROBAR_LIDER: "PENDIENTE_APROBACION_LIDER",
    RECHAZAR_LIDER: "PENDIENTE_APROBACION_LIDER",
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
    if (action === "APROBAR_LIDER" || action === "RECHAZAR_LIDER") {
      if (actor.role !== "LIDER_PROCESO" || current.currentResponsibleId !== actor.id) {
        throw new Error("Este registro está asignado a otro líder de proceso.");
      }
      const approval = payload.aprobacion;
      if (!approval) throw new Error("Completa la decisión del líder.");
      required(approval.observaciones, "Las observaciones");
      required(approval.firma, "La firma");
      const approved = action === "APROBAR_LIDER";
      const now = new Date();
      const quality = approved
        ? await tx.user.findFirst({ where: { company: current.company, role: "GESTION_CALIDAD", active: true } })
        : null;
      if (approved && !quality) throw new Error("No hay un responsable activo de Gestión de Calidad.");
      const creator = !approved ? await tx.user.findUnique({ where: { id: current.creatorUserId } }) : null;

      await tx.changeApproval.create({
        data: {
          changeRequestId: id,
          approverUserId: actor.id,
          approverName: actor.name,
          approverRole: actor.role,
          approved,
          position: actor.position ?? roleLabels.LIDER_PROCESO,
          observations: approval.observaciones.trim(),
          signature: approval.firma,
          approvedAt: now,
        },
      });
      const nextState = approved ? "EN_REVISION_CALIDAD" : "RECHAZADO_LIDER";
      await tx.changeRequest.update({
        where: { id },
        data: {
          currentState: nextState,
          currentResponsibleRole: approved ? "GESTION_CALIDAD" : creator?.role ?? "COLABORADOR",
          currentResponsibleId: approved ? quality?.id : current.creatorUserId,
          currentResponsibleName: approved ? quality?.name : current.creatorName,
        },
      });
      await tx.changeHistory.create({
        data: historyEntry(id, actor, action, current.currentState, nextState, approval.observaciones.trim()),
      });
      return;
    }

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
      const signature = required(payload.firmaRevisionCalidad, "La firma de la revisión de Calidad");
      const now = new Date();
      await tx.changeApproval.create({
        data: {
          changeRequestId: id,
          approverUserId: actor.id,
          approverName: actor.name,
          approverRole: actor.role,
          approved: true,
          position: actor.position ?? roleLabels.GESTION_CALIDAD,
          observations: observation,
          signature,
          approvedAt: now,
        },
      });
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
          position: actor.position ?? roleLabels[actor.role as GestionCambioRol],
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
      required(followup.acciones, "Las acciones de seguimiento");
      if (!followup.cambioEficaz) throw new Error("Indica si el cambio fue eficaz.");
      if (followup.cambioEficaz !== "SI") {
        throw new Error("Un cambio no eficaz debe permanecer en seguimiento y no puede finalizarse como aprobado.");
      }
      const now = new Date();
      await tx.changeFollowup.create({
        data: {
          changeRequestId: id,
          responsibleUserId: actor.id,
          responsibleName: actor.name,
          effective: followup.cambioEficaz === "SI",
          observations: followup.observaciones.trim(),
          actions: followup.acciones.trim(),
          position: actor.position ?? roleLabels.GESTION_CALIDAD,
          followupAt: now,
          closedAt: now,
        },
      });
      await tx.changeRequest.update({ where: { id }, data: { currentState: "APROBADO", closedAt: now } });
      await tx.changeHistory.create({
        data: historyEntry(id, actor, action, current.currentState, "APROBADO", followup.observaciones.trim() || "Calidad finaliza el formato SIG-F006 como aprobado."),
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
      position: input.cargo?.trim() || roleLabels[input.rol],
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
