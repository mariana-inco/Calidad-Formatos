"use client";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Eye,
  FileText,
  Hash,
  LayoutGrid,
  Search,
  ShieldCheck,
  Table2,
  Tags,
  Timer,
  UserCheck,
  UserRound,
  Workflow,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { GestionCambio, GestionCambioAprobacion, GestionCambioEstado, UsuarioGestionCambio } from "./types";

type AprobacionGestionCambiosViewProps = {
  registros: GestionCambio[];
  aprobadorActual: string;
  usuarioActual?: UsuarioGestionCambio;
  onView: (registro: GestionCambio) => void;
};

type ViewMode = "cards" | "table";

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

const aprobacionClassName: Record<GestionCambioAprobacion, string> = {
  Pendiente: "border-amber-200 bg-amber-50 text-amber-800",
  Devuelta: "border-red-200 bg-red-50 text-red-700",
  Validada: "border-blue-200 bg-blue-50 text-blue-800",
  Firmada: "border-indigo-200 bg-indigo-50 text-indigo-800",
  Cerrada: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Aprobada: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rechazada: "border-red-200 bg-red-50 text-red-700",
};

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${className}`}>{label}</span>;
}

function SummaryCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <article className={`rounded-lg border p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide opacity-75">{title}</p>
          <p className="mt-3 text-3xl font-black">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-md bg-white/70">{icon}</div>
      </div>
    </article>
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

const canViewAllApprovals = (aprobador: string) => aprobador.trim().toLowerCase() === "gestión de calidad" || aprobador.trim().toLowerCase() === "gestion de calidad";

export function AprobacionGestionCambiosView({ registros, aprobadorActual, usuarioActual, onView }: AprobacionGestionCambiosViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const puedeVerTodo = !usuarioActual || usuarioActual.rol === "Calidad" || canViewAllApprovals(aprobadorActual);

  const registrosAprobacion = useMemo(
    () =>
      registros
        .filter((registro) => {
          if (!usuarioActual) return puedeVerTodo || registro.aprobador === aprobadorActual;
          if (registro.empresa !== usuarioActual.empresa) return false;
          if (usuarioActual.rol === "Calidad") return true;
          return registro.aprobador === aprobadorActual;
        })
        .map((registro) => ({
          ...registro,
          aprobacion:
            registro.aprobacion ??
            (registro.estado === "Aprobado" ? "Aprobada" : registro.estado === "Rechazado" ? "Rechazada" : "Pendiente"),
        })),
    [aprobadorActual, puedeVerTodo, registros, usuarioActual],
  );

  const filteredRegistros = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return registrosAprobacion;

    return registrosAprobacion.filter((registro) =>
      [registro.codigo, registro.empresa, registro.liderProceso, registro.proceso, registro.aprobador, registro.tipoCambio, registro.estado, registro.aprobacion]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [registrosAprobacion, searchTerm]);

  const metrics = {
    total: registrosAprobacion.length,
    aprobadas: registrosAprobacion.filter((registro) => ["Validada", "Firmada", "Cerrada", "Aprobada"].includes(registro.aprobacion)).length,
    enRevision: registrosAprobacion.filter((registro) => registro.estado === "En revisión").length,
    pendientes: registrosAprobacion.filter((registro) => registro.aprobacion === "Pendiente").length,
    rechazadas: registrosAprobacion.filter((registro) => registro.aprobacion === "Devuelta" || registro.aprobacion === "Rechazada").length,
  };

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-14 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10">
            <ClipboardCheck className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black sm:text-3xl">Aprobación de Gestión de Cambios</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
              Revisión, aprobación y seguimiento de solicitudes de gestión de cambio
            </p>
            <p className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-slate-100">
              {usuarioActual
                ? `${usuarioActual.nombre} - ${usuarioActual.empresa} - ${usuarioActual.rol}`
                : puedeVerTodo
                  ? "Vista temporal de Calidad: seguimiento completo"
                  : `Aprobador: ${aprobadorActual}`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total" value={metrics.total} icon={<BarChart3 className="size-5" />} className="border-slate-200 bg-slate-100 text-slate-800" />
        <SummaryCard title="Aprobadas" value={metrics.aprobadas} icon={<CheckCircle2 className="size-5" />} className="border-emerald-200 bg-emerald-50 text-emerald-800" />
        <SummaryCard title="En revisión" value={metrics.enRevision} icon={<FileText className="size-5" />} className="border-indigo-200 bg-indigo-50 text-indigo-800" />
        <SummaryCard title="Pendientes" value={metrics.pendientes} icon={<Timer className="size-5" />} className="border-amber-200 bg-amber-50 text-amber-800" />
        <SummaryCard title="Rechazadas" value={metrics.rechazadas} icon={<XCircle className="size-5" />} className="border-red-200 bg-red-50 text-red-700" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">Historial de Gestiones para Aprobación</h2>
              <p className="mt-1 text-sm text-slate-600">Filtra y revisa las solicitudes pendientes o aprobadas.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 sm:w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por código, líder de proceso, proceso, tipo de cambio, estado..."
                  className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <div className="grid grid-cols-2 rounded-md border border-slate-200 bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-xs font-black transition ${
                    viewMode === "cards" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  <LayoutGrid className="size-4" />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex h-9 items-center justify-center gap-2 rounded px-3 text-xs font-black transition ${
                    viewMode === "table" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  <Table2 className="size-4" />
                  Tabla
                </button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            {filteredRegistros.length > 0 ? (
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
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
                      <TableHeadLabel icon={<UserCheck className="size-3.5" />}>Aprobador</TableHeadLabel>
                    </th>
                    <th className="px-5 py-4">
                      <TableHeadLabel icon={<CircleDot className="size-3.5" />}>Estado</TableHeadLabel>
                    </th>
                    <th className="px-5 py-4">
                      <TableHeadLabel icon={<ShieldCheck className="size-3.5" />}>Aprobación</TableHeadLabel>
                    </th>
                    <th className="px-5 py-4 text-center">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRegistros.map((registro) => (
                    <tr key={registro.id} className="text-slate-800 transition hover:bg-blue-50/40">
                      <td className="px-5 py-5 font-black text-emerald-900">{registro.codigo}</td>
                      <td className="px-5 py-5">{registro.fecha}</td>
                      <td className="px-5 py-5 font-bold text-slate-950">{registro.empresa}</td>
                      <td className="px-5 py-5 font-black uppercase text-slate-950">{registro.liderProceso}</td>
                      <td className="px-5 py-5">{registro.proceso}</td>
                      <td className="max-w-xs px-5 py-5 leading-6">{registro.tipoCambio}</td>
                      <td className="px-5 py-5">{registro.aprobador}</td>
                      <td className="px-5 py-5">
                        <Badge label={registro.estado} className={estadoClassName[registro.estado]} />
                      </td>
                      <td className="px-5 py-5">
                        <Badge label={registro.aprobacion} className={aprobacionClassName[registro.aprobacion]} />
                      </td>
                      <td className="px-5 py-5 text-center">
                        <button
                          type="button"
                          onClick={() => onView(registro)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        >
                          <Eye className="size-4" />
                          Ver Gestión
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center">
                <h3 className="text-base font-black text-slate-950">No hay gestiones para aprobación</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  {puedeVerTodo
                    ? "Cuando se guarden solicitudes reales de gestión de cambio, se listarán aquí para control de calidad."
                    : "Cuando existan solicitudes asignadas a este aprobador, se listarán aquí para revisión."}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredRegistros.length > 0 ? filteredRegistros.map((registro) => (
              <article key={registro.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{registro.codigo}</p>
                    <h3 className="mt-1 text-base font-bold text-slate-950">{registro.liderProceso}</h3>
                  </div>
                  <Badge label={registro.aprobacion} className={aprobacionClassName[registro.aprobacion]} />
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
                    <span className="font-bold text-slate-950">Aprobador:</span> {registro.aprobador}
                  </p>
                  <p>
                    <span className="font-bold text-slate-950">Tipo:</span> {registro.tipoCambio}
                  </p>
                  <div>
                    <Badge label={registro.estado} className={estadoClassName[registro.estado]} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onView(registro)}
                  className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  <Eye className="size-4" />
                  Ver Gestión
                </button>
              </article>
            )) : (
              <div className="col-span-full p-8 text-center">
                <h3 className="text-base font-black text-slate-950">No hay gestiones para aprobación</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  {puedeVerTodo
                    ? "Cuando se guarden solicitudes reales de gestión de cambio, se listarán aquí para control de calidad."
                    : "Cuando existan solicitudes asignadas a este aprobador, se listarán aquí para revisión."}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
