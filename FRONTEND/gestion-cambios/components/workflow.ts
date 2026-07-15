import type { GestionCambio, GestionCambioEstado, GestionCambioRol, UsuarioGestionCambio } from "./types";

export const roleLabels: Record<GestionCambioRol, string> = {
  COLABORADOR: "Colaborador",
  GESTION_CALIDAD: "Gestión de Calidad",
  GERENCIA_ADMINISTRATIVA: "Gerencia Administrativa",
  LIDER_PROCESO: "Líder de Proceso",
  APROBADOR_ADICIONAL: "Aprobador adicional",
};

export const estadoLabels: Record<GestionCambioEstado, string> = {
  BORRADOR: "Borrador",
  CREADO: "Creado",
  PENDIENTE_APROBACION_LIDER: "Pendiente de aprobación del líder",
  RECHAZADO_LIDER: "Rechazado por el líder",
  EN_REVISION_CALIDAD: "En revisión por Calidad",
  DEVUELTO_LIDER: "Devuelto al Líder",
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  RECHAZADO_APROBADOR: "Rechazado",
  EN_SEGUIMIENTO_CALIDAD: "En seguimiento por Calidad",
  APROBADO: "Aprobado",
  CERRADO: "Cerrado",
  VENCIDO: "Vencido",
};

export const estadoBadgeClassName: Record<GestionCambioEstado, string> = {
  BORRADOR: "border-slate-200 bg-slate-100 text-slate-700",
  CREADO: "border-sky-200 bg-sky-50 text-sky-800",
  PENDIENTE_APROBACION_LIDER: "border-blue-200 bg-blue-50 text-blue-800",
  RECHAZADO_LIDER: "border-red-200 bg-red-50 text-red-800",
  EN_REVISION_CALIDAD: "border-amber-200 bg-amber-50 text-amber-800",
  DEVUELTO_LIDER: "border-orange-200 bg-orange-50 text-orange-800",
  PENDIENTE_APROBACION: "border-blue-200 bg-blue-50 text-blue-800",
  RECHAZADO_APROBADOR: "border-red-200 bg-red-50 text-red-800",
  EN_SEGUIMIENTO_CALIDAD: "border-purple-200 bg-purple-50 text-purple-800",
  APROBADO: "border-emerald-300 bg-emerald-50 text-emerald-900",
  CERRADO: "border-emerald-200 bg-emerald-50 text-emerald-800",
  VENCIDO: "border-red-300 bg-red-50 text-red-900",
};

const approvalStatesByRole: Record<GestionCambioRol, GestionCambioEstado[]> = {
  COLABORADOR: [],
  GESTION_CALIDAD: ["EN_REVISION_CALIDAD", "EN_SEGUIMIENTO_CALIDAD", "VENCIDO"],
  LIDER_PROCESO: ["PENDIENTE_APROBACION_LIDER", "BORRADOR", "DEVUELTO_LIDER", "RECHAZADO_APROBADOR", "RECHAZADO_LIDER", "APROBADO", "CERRADO"],
  GERENCIA_ADMINISTRATIVA: ["PENDIENTE_APROBACION"],
  APROBADOR_ADICIONAL: ["PENDIENTE_APROBACION"],
};

export function canAccessApproval(usuario?: UsuarioGestionCambio) {
  return Boolean(usuario && usuario.activo && approvalStatesByRole[usuario.rol].length > 0);
}

export function canEditCorrection(registro: GestionCambio, usuario?: UsuarioGestionCambio) {
  return Boolean(
    usuario &&
      (registro.estado === "DEVUELTO_LIDER" ||
        registro.estado === "RECHAZADO_LIDER" ||
        registro.estado === "RECHAZADO_APROBADOR") &&
      (registro.liderProcesoId === usuario.id || registro.creadorId === usuario.id),
  );
}

export function hasApproverDecision(registro: GestionCambio, usuario?: UsuarioGestionCambio) {
  return registro.historial.some(
    (decision) =>
      (decision.accion === "APROBAR_LIDER" ||
        decision.accion === "RECHAZAR_LIDER" ||
        decision.accion === "REGISTRAR_APROBACION" ||
        decision.accion === "REGISTRAR_RECHAZO") &&
      (!usuario || decision.usuario === usuario.nombre),
  );
}

export function filterRegistrosForCreation(registros: GestionCambio[], usuario?: UsuarioGestionCambio) {
  if (!usuario) return [];

  return registros.filter((registro) => {
    if (registro.empresa !== usuario.empresa) return false;
    return registro.creadorId === usuario.id || registro.liderProcesoId === usuario.id;
  });
}

export function filterRegistrosForApproval(registros: GestionCambio[], usuario?: UsuarioGestionCambio) {
  if (!usuario || !canAccessApproval(usuario)) return [];

  const allowedStates = approvalStatesByRole[usuario.rol];
  return registros.filter((registro) => {
    if (registro.empresa !== usuario.empresa) return false;
    if (!allowedStates.includes(registro.estado)) return false;

    if (usuario.rol === "GERENCIA_ADMINISTRATIVA" || usuario.rol === "APROBADOR_ADICIONAL") {
      if (hasApproverDecision(registro, usuario)) return false;
      return registro.responsableActualId === usuario.id || (!registro.responsableActualId && registro.responsableActual === usuario.rol);
    }

    if (registro.responsableActual !== usuario.rol) return false;
    if (usuario.rol === "LIDER_PROCESO") {
      return registro.creadorId === usuario.id || registro.liderProcesoId === usuario.id || registro.proceso === usuario.proceso;
    }
    return true;
  });
}

export function filterRegistrosForApprovalHistory(registros: GestionCambio[], usuario?: UsuarioGestionCambio) {
  if (!usuario || !canAccessApproval(usuario)) return [];

  const belongsToUser = (userId?: string, userName?: string) =>
    userId ? userId === usuario.id : userName === usuario.nombre;

  return registros.filter((registro) => {
    if (registro.empresa !== usuario.empresa) return false;

    if (usuario.rol === "GESTION_CALIDAD") {
      return registro.historial.some(
        (decision) =>
          (decision.accion === "SOLICITAR_CORRECCION" ||
            decision.accion === "VALIDAR_REMITIR" ||
            decision.accion === "CERRAR_FORMATO") &&
          belongsToUser(decision.usuarioId, decision.usuario),
      );
    }

    if (usuario.rol === "GERENCIA_ADMINISTRATIVA") {
      return registro.historial.some(
        (decision) =>
          (decision.accion === "REGISTRAR_APROBACION" || decision.accion === "REGISTRAR_RECHAZO") &&
          belongsToUser(decision.usuarioId, decision.usuario),
      );
    }

    if (usuario.rol === "APROBADOR_ADICIONAL") {
      return registro.historial.some(
        (decision) =>
          (decision.accion === "REGISTRAR_APROBACION" || decision.accion === "REGISTRAR_RECHAZO") &&
          belongsToUser(decision.usuarioId, decision.usuario),
      );
    }

    return registro.historial.some((decision) =>
      (decision.accion === "APROBAR_LIDER" ||
        decision.accion === "RECHAZAR_LIDER" ||
        decision.accion === "REENVIAR_CALIDAD") &&
      belongsToUser(decision.usuarioId, decision.usuario),
    );
  });
}

export function addMonths(dateValue: string, months: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function getDiasRestantes(fechaLimite?: string) {
  if (!fechaLimite) return null;
  const today = new Date();
  const limit = new Date(`${fechaLimite}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((limit.getTime() - today.getTime()) / 86400000);
}

export function getEstadoCierre(registro: GestionCambio) {
  if (registro.estado === "CERRADO" || registro.estado === "APROBADO") return "Cerrado";
  const dias = getDiasRestantes(registro.fechaLimiteCierre);
  if (dias === null) return "Sin fecha de seguimiento";
  if (dias < 0) return "Vencido";
  if (dias <= 15) return "Próximo a vencerse";
  return "En tiempo";
}

export function getEffectiveEstado(registro: GestionCambio): GestionCambioEstado {
  if (registro.estado === "CERRADO" || registro.estado === "APROBADO") return registro.estado;
  return getEstadoCierre(registro) === "Vencido" ? "VENCIDO" : registro.estado;
}
