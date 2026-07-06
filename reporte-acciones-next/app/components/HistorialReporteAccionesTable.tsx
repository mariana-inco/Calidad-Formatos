"use client";

import { CalendarDays, CircleDot, Eye, Hash, Trash2, UserRound, Workflow } from "lucide-react";
import type { ReporteAccionesRegistro, ReporteEstado } from "./types";

type HistorialReporteAccionesTableProps = {
  registros: ReporteAccionesRegistro[];
  onView: (registro: ReporteAccionesRegistro) => void;
  onDelete: (registroId: string) => void;
};

const estadoClassName: Record<ReporteEstado, string> = {
  Borrador: "border-slate-200 bg-slate-100 text-slate-700",
  "En revisión de Calidad": "border-amber-200 bg-amber-50 text-amber-800",
  "Requiere corrección": "border-red-200 bg-red-50 text-red-700",
  "Aprobada por Calidad": "border-blue-200 bg-blue-50 text-blue-800",
  "En cierre por líder": "border-indigo-200 bg-indigo-50 text-indigo-800",
  "Cierre enviado a Calidad": "border-purple-200 bg-purple-50 text-purple-800",
  Cerrado: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function EstadoBadge({ estado }: { estado: ReporteEstado }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoClassName[estado]}`}>{estado}</span>;
}

function ActionButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
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

export function HistorialReporteAccionesTable({ registros, onView, onDelete }: HistorialReporteAccionesTableProps) {
  if (registros.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-black text-slate-950">No hay reportes de acciones registrados</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Cuando diligencies y guardes un Reporte de Acciones, aparecerá aquí en el historial.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f4f7fb] text-[11px] font-black uppercase tracking-wide text-slate-600">
            <tr className="border-y border-slate-200">
              <th className="px-5 py-4">
                <TableHeadLabel icon={<Hash className="size-3.5" />}>Código</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<CalendarDays className="size-3.5" />}>Fecha</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<UserRound className="size-3.5" />}>Líder de proceso</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<Workflow className="size-3.5" />}>Proceso</TableHeadLabel>
              </th>
              <th className="px-5 py-4">Tipo de hallazgo</th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<CircleDot className="size-3.5" />}>Estado</TableHeadLabel>
              </th>
              <th className="px-5 py-4">Responsable actual</th>
              <th className="px-5 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.map((registro) => (
              <tr key={registro.id} className="text-slate-800 transition hover:bg-blue-50/40">
                <td className="px-5 py-5 font-black text-emerald-900">{registro.consecutivo}</td>
                <td className="px-5 py-5">{registro.fechaCreacion}</td>
                <td className="px-5 py-5 font-black uppercase text-slate-950">{registro.liderProceso}</td>
                <td className="px-5 py-5">{registro.proceso}</td>
                <td className="px-5 py-5">{registro.tipoHallazgo}</td>
                <td className="px-5 py-4">
                  <EstadoBadge estado={registro.estado} />
                </td>
                <td className="px-5 py-5 font-semibold">{registro.responsableActual}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton label="Ver reporte" onClick={() => onView(registro)}>
                      <Eye className="size-4" />
                    </ActionButton>
                    <ActionButton label="Eliminar" onClick={() => onDelete(registro.id)}>
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 lg:hidden">
        {registros.map((registro) => (
          <article key={registro.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
              <ActionButton label="Eliminar" onClick={() => onDelete(registro.id)}>
                <Trash2 className="size-4" />
              </ActionButton>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
