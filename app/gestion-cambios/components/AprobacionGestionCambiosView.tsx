"use client";

import { ClipboardCheck, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { GestionCambio, UsuarioGestionCambio } from "./types";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import {
  canAccessApproval,
  canEditCorrection,
  filterRegistrosForApproval,
  filterRegistrosForApprovalHistory,
  hasApproverDecision,
  roleLabels,
} from "./workflow";

type AprobacionGestionCambiosViewProps = {
  registros: GestionCambio[];
  usuarioActual?: UsuarioGestionCambio;
  onView: (registro: GestionCambio) => void;
  onEdit: (registro: GestionCambio) => void;
};

function ApprovalSection({
  title,
  description,
  registros,
  usuarioActual,
  onView,
  onEdit,
}: {
  title: string;
  description: string;
  registros: GestionCambio[];
  usuarioActual?: UsuarioGestionCambio;
  onView: (registro: GestionCambio) => void;
  onEdit: (registro: GestionCambio) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-black uppercase text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <HistorialGestionCambiosTable
        registros={registros}
        emptyTitle="No hay registros en esta bandeja"
        emptyDescription="Cuando el flujo asigne registros a esta etapa, aparecerán aquí."
        canEdit={(registro) => canEditCorrection(registro, usuarioActual)}
        onView={onView}
        onEdit={onEdit}
      />
    </section>
  );
}

export function AprobacionGestionCambiosView({ registros, usuarioActual, onView, onEdit }: AprobacionGestionCambiosViewProps) {
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyState, setHistoryState] = useState("");

  if (!canAccessApproval(usuarioActual)) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 size-5 shrink-0" />
          <div>
            <h1 className="text-lg font-black">Aprobación no disponible para este usuario</h1>
            <p className="mt-1 text-sm leading-6">
              Esta pestaña solo está visible para usuarios activos configurados como Calidad, líderes o aprobadores.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const registrosAsignados = filterRegistrosForApproval(registros, usuarioActual);
  const registrosHistorial = filterRegistrosForApprovalHistory(registros, usuarioActual);

  const pendientesAprobar = registrosAsignados.filter((registro) => registro.estado === "PENDIENTE_APROBACION" && !hasApproverDecision(registro, usuarioActual));
  const pendientesLider = registrosAsignados.filter((registro) => registro.estado === "PENDIENTE_APROBACION_LIDER");
  const registrosCalidad = [...registrosAsignados, ...registrosHistorial].filter(
    (registro, index, items) => items.findIndex((item) => item.id === registro.id) === index,
  );
  const registrosConsulta = usuarioActual?.rol === "GESTION_CALIDAD" ? registrosCalidad : registrosHistorial;
  const query = historyQuery.trim().toLocaleLowerCase("es");
  const historialFiltrado = registrosConsulta.filter((registro) => {
    const matchesQuery =
      !query ||
      registro.codigo.toLocaleLowerCase("es").includes(query) ||
      registro.liderProceso.toLocaleLowerCase("es").includes(query) ||
      registro.proceso.toLocaleLowerCase("es").includes(query);
    return matchesQuery && (!historyState || registro.estado === historyState);
  });

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

      {usuarioActual?.rol === "GESTION_CALIDAD" ? (
        <section className="space-y-3">
            <div>
              <h2 className="text-lg font-black uppercase text-slate-950">Historial de registros gestionados</h2>
              <p className="mt-1 text-sm text-slate-600">Consulta los registros asignados o revisados por Calidad y su estado actual.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_15rem]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
                <input
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder="Buscar por código, líder o proceso"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <select
                value={historyState}
                onChange={(event) => setHistoryState(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Todos los estados</option>
                <option value="EN_REVISION_CALIDAD">Pendiente de revisión</option>
                <option value="PENDIENTE_APROBACION">Pendiente de aprobación</option>
                <option value="EN_SEGUIMIENTO_CALIDAD">En seguimiento</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO_APROBADOR">Rechazado</option>
              </select>
            </div>
            <HistorialGestionCambiosTable
              registros={historialFiltrado}
              emptyTitle="No hay registros con estos filtros"
              emptyDescription="Ajusta la búsqueda o el estado seleccionado."
              onView={onView}
            />
          </section>
      ) : usuarioActual?.rol === "GERENCIA_ADMINISTRATIVA" || usuarioActual?.rol === "APROBADOR_ADICIONAL" ? (
        <>
          <ApprovalSection title="Pendientes por aprobar" description="Registros asignados a tu usuario o rol aprobador." registros={pendientesAprobar} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection title="Historial de aprobaciones realizadas" description="Registros que ya aprobaste o rechazaste." registros={registrosHistorial} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
        </>
      ) : (
        <>
          <ApprovalSection title="Pendientes de aprobación del líder" description="Cambios creados por colaboradores que requieren tu decisión como líder del proceso." registros={pendientesLider} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection title="Historial de decisiones" description="Registros que aprobaste, rechazaste o atendiste como líder." registros={registrosHistorial} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
        </>
      )}
    </div>
  );
}
