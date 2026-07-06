import type { GestionCambio, GestionCambioEstado, GestionCambioRol, UsuarioGestionCambio } from "./types";

export const roleLabels: Record<GestionCambioRol, string> = {
  GESTION_CALIDAD: "Gestión de Calidad",
  GERENCIA_ADMINISTRATIVA: "Gerencia Administrativa",
  LIDER_PROCESO: "Líder de Proceso",
};

export const estadoLabels: Record<GestionCambioEstado, string> = {
  EN_REVISION: "En revisión",
  REQUIERE_CORRECCION: "Requiere corrección",
  PENDIENTE_FIRMA: "Pendiente firma",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO: "Cerrado",
};

export const estadoBadgeClassName: Record<GestionCambioEstado, string> = {
  EN_REVISION: "border-amber-200 bg-amber-50 text-amber-800",
  REQUIERE_CORRECCION: "border-orange-200 bg-orange-50 text-orange-800",
  PENDIENTE_FIRMA: "border-blue-200 bg-blue-50 text-blue-800",
  EN_SEGUIMIENTO: "border-purple-200 bg-purple-50 text-purple-800",
  CERRADO: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const approvalStatesByRole: Record<GestionCambioRol, GestionCambioEstado[]> = {
  GESTION_CALIDAD: ["EN_REVISION", "EN_SEGUIMIENTO"],
  LIDER_PROCESO: ["REQUIERE_CORRECCION"],
  GERENCIA_ADMINISTRATIVA: ["PENDIENTE_FIRMA"],
};

export function canAccessApproval(usuario?: UsuarioGestionCambio) {
  return Boolean(usuario && usuario.activo && approvalStatesByRole[usuario.rol]);
}

export function canEditCorrection(registro: GestionCambio, usuario?: UsuarioGestionCambio) {
  return Boolean(usuario && registro.estado === "REQUIERE_CORRECCION" && registro.responsableActual === "LIDER_PROCESO" && registro.liderProcesoId === usuario.id);
}

export function filterRegistrosForCreation(registros: GestionCambio[], usuario?: UsuarioGestionCambio) {
  if (!usuario) return [];
  return registros.filter((registro) => registro.creadorId === usuario.id);
}

export function filterRegistrosForApproval(registros: GestionCambio[], usuario?: UsuarioGestionCambio) {
  if (!usuario || !canAccessApproval(usuario)) return [];

  const allowedStates = approvalStatesByRole[usuario.rol];
  return registros.filter((registro) => {
    if (registro.empresa !== usuario.empresa) return false;
    if (!allowedStates.includes(registro.estado)) return false;
    if (registro.responsableActual !== usuario.rol) return false;
    if (usuario.rol === "LIDER_PROCESO") return registro.liderProcesoId === usuario.id || registro.proceso === usuario.proceso;
    return true;
  });
}

export function filterRegistrosForApprovalHistory(registros: GestionCambio[], usuario?: UsuarioGestionCambio) {
  if (!usuario || !canAccessApproval(usuario)) return [];

  return registros.filter((registro) => {
    if (registro.empresa !== usuario.empresa) return false;

    if (usuario.rol === "GESTION_CALIDAD") {
      return registro.historial.some((decision) => decision.accion === "VALIDAR_REMITIR" && decision.usuario === usuario.nombre);
    }

    if (usuario.rol === "GERENCIA_ADMINISTRATIVA") {
      return registro.historial.some((decision) => decision.accion === "REGISTRAR_FIRMA" && decision.usuario === usuario.nombre);
    }

    return registro.historial.some((decision) => decision.accion === "REENVIAR_CALIDAD" && decision.usuario === usuario.nombre);
  });
}
