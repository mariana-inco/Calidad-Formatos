"use client";

import { CalendarDays, CircleDot, Eye, Hash, Pencil, Tags, Trash2, UserRound, Workflow } from "lucide-react";
import type { GestionCambio, GestionCambioEstado } from "./types";

type HistorialGestionCambiosTableProps = {
  registros: GestionCambio[];
  onView: (registro: GestionCambio) => void;
  onEdit: (registro: GestionCambio) => void;
  onDelete: (registroId: string) => void;
};

const estadoClassName: Record<GestionCambioEstado, string> = {
  Borrador: "border-slate-200 bg-slate-100 text-slate-700",
  "En revisión": "border-amber-200 bg-amber-50 text-amber-800",
  "Requiere corrección": "border-red-200 bg-red-50 text-red-700",
  "Pendiente firma": "border-blue-200 bg-blue-50 text-blue-800",
  "En seguimiento": "border-indigo-200 bg-indigo-50 text-indigo-800",
  Cerrado: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Aprobado: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rechazado: "border-red-200 bg-red-50 text-red-700",
};

function EstadoBadge({ estado }: { estado: GestionCambioEstado }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoClassName[estado]}`}>{estado}</span>;
}

function ActionButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      {icon}
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

export function HistorialGestionCambiosTable({ registros, onView, onEdit, onDelete }: HistorialGestionCambiosTableProps) {
  if (registros.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-black text-slate-950">No hay gestiones de cambio registradas</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Cuando diligencies y guardes una solicitud desde el botón Crear Gestión de Cambio, aparecerá aquí en el historial.
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
                <TableHeadLabel icon={<Workflow className="size-3.5" />}>Empresa</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<UserRound className="size-3.5" />}>Líder de proceso</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<Workflow className="size-3.5" />}>Proceso</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<Tags className="size-3.5" />}>Tipo de cambio</TableHeadLabel>
              </th>
              <th className="px-5 py-4">
                <TableHeadLabel icon={<CircleDot className="size-3.5" />}>Estado</TableHeadLabel>
              </th>
              <th className="px-5 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros.map((registro) => (
              <tr key={registro.id} className="text-slate-800 transition hover:bg-blue-50/40">
                <td className="px-5 py-5 font-black text-emerald-900">{registro.codigo}</td>
                <td className="px-5 py-5">{registro.fecha}</td>
                <td className="px-5 py-5 font-bold text-slate-950">{registro.empresa}</td>
                <td className="px-5 py-5 font-black uppercase text-slate-950">{registro.liderProceso}</td>
                <td className="px-5 py-5">{registro.proceso}</td>
                <td className="max-w-xs px-5 py-5 leading-6">{registro.tipoCambio}</td>
                <td className="px-5 py-4">
                  <EstadoBadge estado={registro.estado} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton label="Ver" icon={<Eye className="size-4" />} onClick={() => onView(registro)} />
                    <ActionButton label="Editar" icon={<Pencil className="size-4" />} onClick={() => onEdit(registro)} />
                    <ActionButton label="Eliminar" icon={<Trash2 className="size-4" />} onClick={() => onDelete(registro.id)} />
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
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{registro.codigo}</p>
                <h3 className="mt-1 text-base font-bold text-slate-950">{registro.liderProceso}</h3>
              </div>
              <EstadoBadge estado={registro.estado} />
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-700">
              <p>
                <span className="font-bold text-slate-950">Fecha:</span> {registro.fecha}
              </p>
              <p>
                <span className="font-bold text-slate-950">Empresa:</span> {registro.empresa}
              </p>
              <p>
                <span className="font-bold text-slate-950">Proceso:</span> {registro.proceso}
              </p>
              <p>
                <span className="font-bold text-slate-950">Tipo:</span> {registro.tipoCambio}
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <ActionButton label="Ver" icon={<Eye className="size-4" />} onClick={() => onView(registro)} />
              <ActionButton label="Editar" icon={<Pencil className="size-4" />} onClick={() => onEdit(registro)} />
              <ActionButton label="Eliminar" icon={<Trash2 className="size-4" />} onClick={() => onDelete(registro.id)} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
