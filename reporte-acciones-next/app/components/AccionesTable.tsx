"use client";

import { Pencil, Trash2 } from "lucide-react";
import { DynamicSelect } from "./DynamicSelect";
import type { ReporteAccion } from "./types";

type AccionesTableProps = {
  acciones: ReporteAccion[];
  canCloseActions?: boolean;
  onEdit: (accion: ReporteAccion) => void;
  onDelete: (accionId: string) => void;
  onUpdateCierre?: (accionId: string, fields: Partial<Pick<ReporteAccion, "cierre" | "fechaCierre" | "observacion" | "evidencia">>) => void;
};

function StatusBadge({ children }: { children: React.ReactNode }) {
  const isClosed = children === "Cerrado";
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${
        isClosed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {children}
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
      className="inline-grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
    >
      {children}
    </button>
  );
}

export function AccionesTable({ acciones, canCloseActions = false, onEdit, onDelete, onUpdateCierre }: AccionesTableProps) {
  if (acciones.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        Las acciones agregadas aparecerán aquí.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-emerald-950 text-center text-xs font-black uppercase tracking-wide text-white">
              <th colSpan={5} className="border-r border-emerald-800 px-4 py-3">
                Implementar
              </th>
              <th colSpan={4} className="border-r border-emerald-800 px-4 py-3">
                Controlar
              </th>
              <th className="px-4 py-3">Acción</th>
            </tr>
            <tr className="bg-emerald-900 text-xs font-black uppercase tracking-wide text-white">
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Aspectos de control</th>
              <th className="px-4 py-3">Descripción acción</th>
              <th className="px-4 py-3">Fecha implementación</th>
              <th className="px-4 py-3">Responsable implementación</th>
              <th className="px-4 py-3">Cierre</th>
              <th className="px-4 py-3">Fecha cierre</th>
              <th className="px-4 py-3">Observación</th>
              <th className="px-4 py-3">Evidencia</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {acciones.map((accion) => (
              <tr key={accion.id} className="align-top text-slate-800 transition hover:bg-blue-50/40">
                <td className="px-4 py-4 font-black text-emerald-900">{accion.numero}</td>
                <td className="px-4 py-4 font-bold">{accion.tipoAccion}</td>
                <td className="max-w-sm px-4 py-4 leading-6">{accion.descripcionAccion}</td>
                <td className="px-4 py-4">{accion.fechaImplementacion}</td>
                <td className="px-4 py-4 font-semibold">{accion.responsableImplementacion}</td>
                <td className="px-4 py-4">
                  {canCloseActions ? (
                    <DynamicSelect
                      id={`cierre-${accion.id}`}
                      value={accion.cierre}
                      options={["Pendiente", "Cerrado"]}
                      compact
                      onChange={(cierre) => onUpdateCierre?.(accion.id, { cierre: cierre as ReporteAccion["cierre"] })}
                    />
                  ) : (
                    <StatusBadge>{accion.cierre}</StatusBadge>
                  )}
                </td>
                <td className="px-4 py-4">
                  {canCloseActions ? (
                    <input
                      type="date"
                      value={accion.fechaCierre}
                      onChange={(event) => onUpdateCierre?.(accion.id, { fechaCierre: event.target.value })}
                      className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-700"
                    />
                  ) : (
                    accion.fechaCierre || "-"
                  )}
                </td>
                <td className="px-4 py-4">
                  {canCloseActions ? (
                    <input
                      value={accion.observacion}
                      onChange={(event) => onUpdateCierre?.(accion.id, { observacion: event.target.value })}
                      placeholder="Observación"
                      className="h-9 w-44 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-700"
                    />
                  ) : (
                    accion.observacion || "-"
                  )}
                </td>
                <td className="px-4 py-4">
                  {canCloseActions ? (
                    <input
                      value={accion.evidencia ?? ""}
                      onChange={(event) => onUpdateCierre?.(accion.id, { evidencia: event.target.value || null })}
                      placeholder="Ruta o nombre evidencia"
                      className="h-9 w-44 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold outline-none focus:border-emerald-700"
                    />
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {accion.evidencia ?? "Sin Imagen"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton label="Editar" onClick={() => onEdit(accion)}>
                      <Pencil className="size-4" />
                    </ActionButton>
                    <ActionButton label="Eliminar" onClick={() => onDelete(accion.id)}>
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
