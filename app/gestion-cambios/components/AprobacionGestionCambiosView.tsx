"use client";

import { ClipboardCheck, ShieldAlert } from "lucide-react";
import type { GestionCambio, UsuarioGestionCambio } from "./types";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import { canAccessApproval, canEditCorrection, filterRegistrosForApproval, filterRegistrosForApprovalHistory, roleLabels } from "./workflow";

type AprobacionGestionCambiosViewProps = {
  registros: GestionCambio[];
  usuarioActual?: UsuarioGestionCambio;
  onView: (registro: GestionCambio) => void;
  onEdit: (registro: GestionCambio) => void;
};

export function AprobacionGestionCambiosView({ registros, usuarioActual, onView, onEdit }: AprobacionGestionCambiosViewProps) {
  if (!canAccessApproval(usuarioActual)) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 size-5 shrink-0" />
          <div>
            <h1 className="text-lg font-black">Aprobación no disponible para este usuario</h1>
            <p className="mt-1 text-sm leading-6">
              Esta pestaña solo está visible para Gestión de Calidad, Líder de Proceso y Gerencia Administrativa.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const registrosAprobacion = filterRegistrosForApproval(registros, usuarioActual);
  const registrosHistorial = filterRegistrosForApprovalHistory(registros, usuarioActual).filter(
    (registro) => !registrosAprobacion.some((pendiente) => pendiente.id === registro.id),
  );
  const historialEstadoBadge = () => {
    if (usuarioActual?.rol === "GESTION_CALIDAD") {
      return { label: "Aprobado", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    }

    if (usuarioActual?.rol === "GERENCIA_ADMINISTRATIVA") {
      return { label: "Firmado", className: "border-blue-200 bg-blue-50 text-blue-800" };
    }

    return { label: "Corregido", className: "border-purple-200 bg-purple-50 text-purple-800" };
  };

  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-800">
            <ClipboardCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-950 sm:text-3xl">Aprobación de Gestión de Cambios</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Usuario activo: <span className="font-bold text-slate-950">{usuarioActual?.nombre}</span> - {usuarioActual ? roleLabels[usuarioActual.rol] : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-950">Pendientes de aprobación</h2>
          <p className="mt-1 text-sm text-slate-600">Registros asignados actualmente a {usuarioActual ? roleLabels[usuarioActual.rol] : "este rol"}.</p>
        </div>
        <HistorialGestionCambiosTable
          registros={registrosAprobacion}
          emptyTitle="No hay registros pendientes para este rol"
          emptyDescription="Cuando el flujo asigne registros a este responsable, aparecerán aquí."
          canEdit={(registro) => canEditCorrection(registro, usuarioActual)}
          onView={onView}
          onEdit={onEdit}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-black uppercase text-slate-950">Historial de aprobación</h2>
          <p className="mt-1 text-sm text-slate-600">Registros ya gestionados por el usuario activo en esta etapa.</p>
        </div>
        <HistorialGestionCambiosTable
          registros={registrosHistorial}
          emptyTitle="No hay registros aprobados en el historial"
          emptyDescription="Cuando apruebes o gestiones un registro, quedará visible aquí."
          getEstadoBadge={historialEstadoBadge}
          onView={onView}
        />
      </section>
    </div>
  );
}
