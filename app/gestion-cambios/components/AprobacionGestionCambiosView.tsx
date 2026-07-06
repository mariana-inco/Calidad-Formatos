"use client";

import { ClipboardCheck, ShieldAlert } from "lucide-react";
import type { GestionCambio, UsuarioGestionCambio } from "./types";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import { canAccessApproval, canEditCorrection, filterRegistrosForApproval, roleLabels } from "./workflow";

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

      <HistorialGestionCambiosTable
        registros={registrosAprobacion}
        emptyTitle="No hay registros pendientes para este rol"
        emptyDescription="Cuando el flujo asigne registros a este responsable, aparecerán aquí."
        canEdit={(registro) => canEditCorrection(registro, usuarioActual)}
        onView={onView}
        onEdit={onEdit}
      />
    </div>
  );
}
