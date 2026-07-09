"use client";

import { CalendarDays, CircleDot, Eye, Pencil, Tags, UserCheck, UserRound, Workflow } from "lucide-react";
import type { GestionCambio } from "./types";
import { estadoBadgeClassName, estadoLabels, getEffectiveEstado, roleLabels } from "./workflow";

type HistorialGestionCambiosTableProps = {
  registros: GestionCambio[];
  emptyTitle?: string;
  emptyDescription?: string;
  getEstadoBadge?: (registro: GestionCambio) => { label: string; className: string };
  canEdit?: (registro: GestionCambio) => boolean;
  onView: (registro: GestionCambio) => void;
  onEdit?: (registro: GestionCambio) => void;
};

function EstadoBadge({
  registro,
  getEstadoBadge,
}: {
  registro: GestionCambio;
  getEstadoBadge?: (registro: GestionCambio) => { label: string; className: string };
}) {
  const estadoBadge = getEstadoBadge?.(registro) ?? {
    label: estadoLabels[getEffectiveEstado(registro)],
    className: estadoBadgeClassName[getEffectiveEstado(registro)],
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase ${estadoBadge.className}`}>
      {estadoBadge.label}
    </span>
  );
}

function ActionButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      {children}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function TableHeadLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-blue-600">{icon}</span>
      {children}
    </span>
  );
}

function FechaHora({ registro }: { registro: GestionCambio }) {
  const timestamp = registro.fechaHora ?? registro.historial[0]?.fecha;

  if (!timestamp) {
    return <span className="whitespace-nowrap">{registro.fecha}</span>;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return <span className="whitespace-nowrap">{registro.fecha}</span>;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const fecha = `${value("year")}-${value("month")}-${value("day")}`;
  const hora = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return (
    <span className="block whitespace-nowrap">
      <span className="block">{fecha}</span>
      <span className="mt-1 block text-xs font-semibold text-slate-500">{hora}</span>
    </span>
  );
}

export function HistorialGestionCambiosTable({
  registros,
  emptyTitle = "No hay gestiones de cambio registradas",
  emptyDescription = "Cuando diligencies y guardes una solicitud, aparecerá aquí.",
  getEstadoBadge,
  canEdit,
  onView,
  onEdit,
}: HistorialGestionCambiosTableProps) {
  if (registros.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-base font-black text-[#08142f]">{emptyTitle}</h2>
        <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-500">{emptyDescription}</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="bg-[#eef3f8] text-[11px] font-black text-slate-700">
            <tr className="border-y border-slate-200">
              <th className="px-4 py-4"><TableHeadLabel icon={<CalendarDays className="size-3.5" />}>Fecha</TableHeadLabel></th>
              <th className="px-4 py-4"><TableHeadLabel icon={<Workflow className="size-3.5" />}>Empresa</TableHeadLabel></th>
              <th className="px-4 py-4"><TableHeadLabel icon={<UserRound className="size-3.5" />}>Líder de proceso</TableHeadLabel></th>
              <th className="px-4 py-4"><TableHeadLabel icon={<Workflow className="size-3.5" />}>Proceso</TableHeadLabel></th>
              <th className="px-4 py-4"><TableHeadLabel icon={<Tags className="size-3.5" />}>Tipo de cambio</TableHeadLabel></th>
              <th className="px-4 py-4"><TableHeadLabel icon={<CircleDot className="size-3.5" />}>Estado</TableHeadLabel></th>
              <th className="px-4 py-4"><TableHeadLabel icon={<UserCheck className="size-3.5" />}>Responsable actual</TableHeadLabel></th>
              <th className="px-4 py-4 text-center">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.map((registro) => {
              const showEdit = Boolean(onEdit && canEdit?.(registro));

              return (
                <tr key={registro.id} className="border-l-4 border-l-amber-400 text-slate-700 transition hover:bg-blue-50/40">
                  <td className="px-4 py-4"><FechaHora registro={registro} /></td>
                  <td className="px-4 py-4 font-bold text-[#08142f]">{registro.empresa}</td>
                  <td className="px-4 py-4 font-black uppercase text-[#08142f]">{registro.liderProceso}</td>
                  <td className="px-4 py-4">{registro.proceso}</td>
                  <td className="max-w-xs px-4 py-4 leading-6">{registro.tipoCambio}</td>
                  <td className="px-4 py-4"><EstadoBadge registro={registro} getEstadoBadge={getEstadoBadge} /></td>
                  <td className="px-4 py-4 font-semibold">{registro.responsableActualNombre ?? roleLabels[registro.responsableActual]}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButton label="Ver detalle" onClick={() => onView(registro)}><Eye className="size-4" /></ActionButton>
                      {showEdit ? <ActionButton label="Editar formato" onClick={() => onEdit?.(registro)}><Pencil className="size-4" /></ActionButton> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {registros.map((registro) => {
          const showEdit = Boolean(onEdit && canEdit?.(registro));

          return (
            <article key={registro.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">{registro.liderProceso}</h3>
                </div>
                <EstadoBadge registro={registro} getEstadoBadge={getEstadoBadge} />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-700">
                <div className="flex items-start gap-1">
                  <span className="font-bold text-slate-950">Fecha:</span>
                  <FechaHora registro={registro} />
                </div>
                <p><span className="font-bold text-slate-950">Empresa:</span> {registro.empresa}</p>
                <p><span className="font-bold text-slate-950">Proceso:</span> {registro.proceso}</p>
                <p><span className="font-bold text-slate-950">Tipo:</span> {registro.tipoCambio}</p>
                <p><span className="font-bold text-slate-950">Responsable:</span> {registro.responsableActualNombre ?? roleLabels[registro.responsableActual]}</p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <ActionButton label="Ver detalle" onClick={() => onView(registro)}><Eye className="size-4" /></ActionButton>
                {showEdit ? <ActionButton label="Editar formato" onClick={() => onEdit?.(registro)}><Pencil className="size-4" /></ActionButton> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
