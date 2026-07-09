"use client";

import { CheckCircle2, ClipboardCheck, Clock3, RotateCw, Search, ShieldAlert, XCircle } from "lucide-react";
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
  const resumenConsulta = {
    total: registrosConsulta.length,
    aprobados: registrosConsulta.filter((registro) => registro.estado === "APROBADO" || registro.estado === "CERRADO").length,
    enProceso: registrosConsulta.filter((registro) => registro.estado === "EN_REVISION_CALIDAD" || registro.estado === "EN_SEGUIMIENTO_CALIDAD").length,
    pendientes: registrosConsulta.filter((registro) => registro.estado === "PENDIENTE_APROBACION" || registro.estado === "PENDIENTE_APROBACION_LIDER").length,
    rechazados: registrosConsulta.filter((registro) => registro.estado === "RECHAZADO_LIDER" || registro.estado === "RECHAZADO_APROBADOR").length,
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg bg-[#111935] text-white shadow-lg shadow-slate-400/30 ring-1 ring-indigo-200">
        <div className="flex flex-col gap-4 bg-[radial-gradient(circle_at_80%_0%,rgba(61,72,140,0.55),transparent_35%)] px-5 py-5 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 text-white shadow-inner">
            <ClipboardCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white sm:text-2xl">Aprobación de Gestión de Cambios</h1>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
              Usuario activo: <span className="font-black text-white">{usuarioActual?.nombre}</span> - {usuarioActual ? roleLabels[usuarioActual.rol] : ""}
            </p>
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total", value: resumenConsulta.total, icon: ClipboardCheck, className: "from-white to-slate-100 text-[#08142f]", iconClassName: "bg-slate-100 text-slate-600" },
          { label: "Aprobadas", value: resumenConsulta.aprobados, icon: CheckCircle2, className: "from-emerald-50 to-white text-emerald-700", iconClassName: "bg-emerald-100 text-emerald-700" },
          { label: "En proceso", value: resumenConsulta.enProceso, icon: RotateCw, className: "from-violet-50 to-white text-violet-700", iconClassName: "bg-violet-100 text-violet-700" },
          { label: "Pendientes", value: resumenConsulta.pendientes, icon: Clock3, className: "from-amber-50 to-white text-amber-700", iconClassName: "bg-amber-100 text-amber-700" },
          { label: "Rechazadas", value: resumenConsulta.rechazados, icon: XCircle, className: "from-red-50 to-white text-red-700", iconClassName: "bg-red-100 text-red-700" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className={`rounded-xl border border-slate-200 bg-gradient-to-br ${item.className} p-4 shadow-sm`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-black">{item.value}</p>
                </div>
                <span className={`grid size-9 place-items-center rounded-lg ${item.iconClassName}`}>
                  <Icon className="size-4" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      {usuarioActual?.rol === "GESTION_CALIDAD" ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-black text-[#08142f]">Historial de registros gestionados</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Consulta los registros asignados o revisados por Calidad y su estado actual.</p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                {historialFiltrado.length} registros
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_15rem]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
                <input
                  value={historyQuery}
                  onChange={(event) => setHistoryQuery(event.target.value)}
                  placeholder="Buscar por código, líder o proceso"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <select
                value={historyState}
                onChange={(event) => setHistoryState(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
