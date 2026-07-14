"use client";

import { CalendarDays, CircleDot, Eye, Hash, Search, UserRound, Workflow } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReporteAccionesRegistro, ReporteEstado } from "./types";

type HistorialReporteAccionesTableProps = {
  registros: ReporteAccionesRegistro[];
  onView: (registro: ReporteAccionesRegistro) => void;
};

const estadoClassName: Record<ReporteEstado, string> = {
  Borrador: "border-slate-200 bg-slate-100 text-slate-700",
  "En revisión de Calidad": "border-amber-200 bg-amber-50 text-amber-800",
  "Devuelto para corrección": "border-red-200 bg-red-50 text-red-700",
  "Aprobado por Calidad": "border-blue-200 bg-blue-50 text-blue-800",
  "En implementación": "border-indigo-200 bg-indigo-50 text-indigo-800",
  "Pendiente de cierre por líder": "border-cyan-200 bg-cyan-50 text-cyan-800",
  "En validación de eficacia": "border-purple-200 bg-purple-50 text-purple-800",
  Cerrado: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "No eficaz / Requiere nueva acción": "border-orange-200 bg-orange-50 text-orange-800",
};

function EstadoBadge({ estado }: { estado: ReporteEstado }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${estadoClassName[estado]}`}>{estado}</span>;
}

function ActionButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-grid size-9 place-items-center rounded-md border border-[#cbd6e4] bg-white text-[#34435e] transition hover:border-blue-500 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {children}
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

export function HistorialReporteAccionesTable({ registros, onView }: HistorialReporteAccionesTableProps) {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return registros.filter(
      (item) =>
        (!state || item.estado === state) &&
        (!term ||
          [item.consecutivo, item.liderProceso, item.proceso, item.tipoHallazgo, item.responsableActual]
            .some((value) => value.toLowerCase().includes(term))),
    );
  }, [registros, search, state]);

  if (registros.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-[#cbd6e4] bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-black text-[#071127]">No hay reportes de acciones registrados</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#50617d]">
          Cuando diligencies y guardes un Reporte de Acciones, aparecerá aquí en el historial.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#d8e2ee] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-black text-[#071127]">Historial de Reportes para Gestión</h2>
          <p className="mt-1 text-sm font-medium text-[#50617d]">Consulta reportes por estado, líder, proceso o responsable actual.</p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-[#50617d]">{filtered.length} reportes</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_300px]">
        <label className="relative block">
          <Search className="absolute left-4 top-3.5 size-5 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código, líder, proceso, hallazgo o responsable" className="h-11 w-full rounded-md border border-[#cbd6e4] bg-white pl-12 pr-4 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </label>
        <select value={state} onChange={(event) => setState(event.target.value)} className="h-11 rounded-md border border-[#cbd6e4] bg-white px-4 text-sm font-bold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
          <option value="">Todos los estados</option>
          {Object.keys(estadoClassName).map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-[#d8e2ee] bg-white">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f4f7fb] text-[11px] font-black uppercase tracking-wide text-[#34435e]">
            <tr className="border-y border-[#d8e2ee]">
              <th className="px-4 py-3">
                <TableHeadLabel icon={<Hash className="size-3.5" />}>Código</TableHeadLabel>
              </th>
              <th className="px-4 py-3">
                <TableHeadLabel icon={<CalendarDays className="size-3.5" />}>Fecha</TableHeadLabel>
              </th>
              <th className="px-4 py-3">
                <TableHeadLabel icon={<UserRound className="size-3.5" />}>Líder de proceso</TableHeadLabel>
              </th>
              <th className="px-4 py-3">
                <TableHeadLabel icon={<Workflow className="size-3.5" />}>Proceso</TableHeadLabel>
              </th>
              <th className="px-4 py-3">Tipo de hallazgo</th>
              <th className="px-4 py-3">
                <TableHeadLabel icon={<CircleDot className="size-3.5" />}>Estado</TableHeadLabel>
              </th>
              <th className="px-4 py-3">Responsable actual</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((registro) => (
              <tr key={registro.id} className="text-[#34435e] transition hover:bg-blue-50/40">
                <td className="px-4 py-4">
                  <span className="inline-flex rounded-md bg-[#071127] px-3 py-1.5 text-xs font-black text-white">{registro.consecutivo}</span>
                </td>
                <td className="px-4 py-4 font-semibold">{new Date(registro.fechaCreacion).toLocaleDateString("es-CO")}</td>
                <td className="px-4 py-4 text-xs font-black uppercase tracking-wide text-[#071127]">{registro.liderProceso}</td>
                <td className="px-4 py-4">{registro.proceso}</td>
                <td className="px-4 py-4">{registro.tipoHallazgo}</td>
                <td className="px-4 py-4">
                  <EstadoBadge estado={registro.estado} />
                </td>
                <td className="px-4 py-4 font-semibold">{registro.responsableActual}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton label="Ver reporte" onClick={() => onView(registro)}>
                      <Eye className="size-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {filtered.map((registro) => (
          <article key={registro.id} className="rounded-lg border border-[#d8e2ee] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{registro.consecutivo}</p>
                <h3 className="mt-1 text-base font-bold text-slate-950">{registro.liderProceso}</h3>
              </div>
              <EstadoBadge estado={registro.estado} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p>
                <span className="font-bold text-slate-950">Fecha:</span> {registro.fechaCreacion}
              </p>
              <p>
                <span className="font-bold text-slate-950">Proceso:</span> {registro.proceso}
              </p>
              <p>
                <span className="font-bold text-slate-950">Tipo:</span> {registro.tipoHallazgo}
              </p>
              <p>
                <span className="font-bold text-slate-950">Responsable:</span> {registro.responsableActual}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <ActionButton label="Ver reporte" onClick={() => onView(registro)}>
                <Eye className="size-4" />
              </ActionButton>
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}
