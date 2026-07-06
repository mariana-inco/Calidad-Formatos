"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfiguracionReporteAccionesView } from "./ConfiguracionReporteAccionesView";
import { HistorialReporteAccionesTable } from "./HistorialReporteAccionesTable";
import { ReporteAccionesForm } from "./ReporteAccionesForm";
import { ReporteAccionesTabs, type ReporteAccionesTab } from "./ReporteAccionesTabs";
import type { ReporteAccionesData, ReporteAccionesRegistro, UsuarioReporteAcciones } from "./types";

type EmpresaRocaKey = "INCO" | "DROMOS";

const empresaActiva: EmpresaRocaKey = "INCO";
const formatosPorEmpresa: Record<EmpresaRocaKey, { codigo: string; version: string; consecutivoPrefix: string }> = {
  INCO: { codigo: "SIG-FO05", version: "04", consecutivoPrefix: "ACOM" },
  DROMOS: { codigo: "SIG-F005", version: "04", consecutivoPrefix: "ACOM" },
};
const registrosIniciales: ReporteAccionesRegistro[] = [];
const usuariosIniciales: UsuarioReporteAcciones[] = [];

function getConsecutivoNumber(consecutivo: string, prefix: string) {
  const match = consecutivo.match(new RegExp(`^${prefix}-\\d{4}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
}

function getNextConsecutivo(registros: ReporteAccionesRegistro[], prefix: string) {
  const nextNumber = registros.reduce((max, registro) => Math.max(max, getConsecutivoNumber(registro.consecutivo, prefix)), 0) + 1;
  return `${prefix}-2026-${String(nextNumber).padStart(3, "0")}`;
}

function cloneReporteData(data: ReporteAccionesData) {
  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }

  return JSON.parse(JSON.stringify(data)) as ReporteAccionesData;
}

function sortRegistrosByRecent(registros: ReporteAccionesRegistro[], prefix: string) {
  return [...registros].sort((a, b) => {
    const fechaComparison = b.fechaCreacion.localeCompare(a.fechaCreacion);
    if (fechaComparison !== 0) return fechaComparison;

    return getConsecutivoNumber(b.consecutivo, prefix) - getConsecutivoNumber(a.consecutivo, prefix);
  });
}

function DetalleReporteModal({ registro, onClose }: { registro: ReporteAccionesRegistro; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <section className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{registro.consecutivo}</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Detalle del Reporte de Acciones</h2>
              <p className="mt-1 text-sm text-slate-600">Responsable actual: {registro.responsableActual}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-grid size-9 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              aria-label="Cerrar detalle"
              title="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{registro.estado}</span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              Fecha: {registro.fechaCreacion}
            </span>
          </div>

          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p>
              <span className="block text-xs font-black uppercase text-slate-500">Líder</span>
              <span className="font-semibold text-slate-950">{registro.liderProceso}</span>
            </p>
            <p>
              <span className="block text-xs font-black uppercase text-slate-500">Proceso</span>
              <span className="font-semibold text-slate-950">{registro.proceso}</span>
            </p>
            <p>
              <span className="block text-xs font-black uppercase text-slate-500">Tipo de hallazgo</span>
              <span className="font-semibold text-slate-950">{registro.tipoHallazgo}</span>
            </p>
            <p>
              <span className="block text-xs font-black uppercase text-slate-500">Fuente</span>
              <span className="font-semibold text-slate-950">{registro.detalle.fuente}</span>
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-md border border-slate-100 bg-slate-50 p-4 lg:col-span-3">
              <p className="text-xs font-black uppercase text-slate-500">Descripción del hallazgo</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.descripcionHallazgo}</p>
            </div>
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Causas</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.causas}</p>
            </div>
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Consecuencias</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.consecuencias}</p>
            </div>
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Riesgos y oportunidades</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.riesgosOportunidades}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-emerald-950 px-4 py-3 text-sm font-black uppercase text-white">Acciones registradas</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead className="bg-emerald-900 text-xs font-black uppercase text-white">
                  <tr>
                    <th className="px-4 py-3">N°</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Fecha implementación</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registro.detalle.acciones.map((accion) => (
                    <tr key={accion.id}>
                      <td className="px-4 py-3 font-black text-emerald-900">{accion.numero}</td>
                      <td className="px-4 py-3 font-semibold">{accion.tipoAccion}</td>
                      <td className="px-4 py-3">{accion.descripcionAccion}</td>
                      <td className="px-4 py-3">{accion.fechaImplementacion}</td>
                      <td className="px-4 py-3 font-semibold">{accion.responsableImplementacion}</td>
                      <td className="px-4 py-3">{accion.cierre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CrearReporteModal({
  codigoFormato,
  versionFormato,
  usuarioActual,
  onClose,
  onSave,
}: {
  codigoFormato: string;
  versionFormato: string;
  usuarioActual?: UsuarioReporteAcciones;
  onClose: () => void;
  onSave: (reporte: ReporteAccionesData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{codigoFormato}</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Crear Reporte de Acciones</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Diligencia la identificación del hallazgo, registra el análisis y agrega las acciones de implementación y control.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            aria-label="Cerrar creación"
            title="Cerrar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-7">
          <ReporteAccionesForm codigoFormato={codigoFormato} versionFormato={versionFormato} usuarioActual={usuarioActual} onSave={onSave} />
        </div>
      </section>
    </div>
  );
}

export function ReporteAccionesPage() {
  const [activeTab, setActiveTab] = useState<ReporteAccionesTab>("historial");
  const [registros, setRegistros] = useState<ReporteAccionesRegistro[]>(registrosIniciales);
  const [usuarios, setUsuarios] = useState<UsuarioReporteAcciones[]>(usuariosIniciales);
  const [usuarioActualId, setUsuarioActualId] = useState("");
  const [selectedRegistro, setSelectedRegistro] = useState<ReporteAccionesRegistro | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const formatoActivo = formatosPorEmpresa[empresaActiva];
  const usuarioActual = useMemo(() => usuarios.find((usuario) => usuario.id === usuarioActualId && usuario.activo), [usuarioActualId, usuarios]);
  const registrosOrdenados = useMemo(() => sortRegistrosByRecent(registros, formatoActivo.consecutivoPrefix), [formatoActivo.consecutivoPrefix, registros]);

  const createRegistro = (data: ReporteAccionesData) => {
    const detalle = { ...cloneReporteData(data), codigo: formatoActivo.codigo, version: formatoActivo.version };

    setRegistros((items) => {
      const registro: ReporteAccionesRegistro = {
        id: crypto.randomUUID(),
        consecutivo: getNextConsecutivo(items, formatoActivo.consecutivoPrefix),
        fechaCreacion: new Date().toISOString().slice(0, 10),
        liderProceso: usuarioActual?.nombre || "Líder de proceso",
        proceso: detalle.proceso || "Sin diligenciar",
        tipoHallazgo: detalle.tipoHallazgo || "Sin diligenciar",
        estado: detalle.estado,
        responsableActual: detalle.aprobadorActual,
        detalle,
      };

      // Log detallado de cada campo del registro
      const registroDetallado = {
        "Identificación": {
          "Consecutivo": registro.consecutivo,
          "ID": registro.id,
          "Fecha de Creación": registro.fechaCreacion,
        },
        "Información General": {
          "Código Formato": detalle.codigo,
          "Versión": detalle.version,
          "Nombre": detalle.nombre,
          "Proceso": registro.proceso,
          "Líder Proceso": registro.liderProceso,
        },
        "Hallazgo": {
          "Tipo": registro.tipoHallazgo,
          "Fecha del Hallazgo": detalle.fechaHallazgo,
          "Fuente": detalle.fuente,
          "Descripción": detalle.descripcionHallazgo,
        },
        "Análisis": {
          "Causas": detalle.causas,
          "Consecuencias": detalle.consecuencias,
          "Riesgos y Oportunidades": detalle.riesgosOportunidades,
        },
        "Flujo de Aprobación": {
          "Estado": registro.estado,
          "Responsable Actual": registro.responsableActual,
          "Fecha Seguimiento Eficacia": detalle.fechaSeguimientoEficacia,
          "Observaciones Calidad": detalle.observacionesCalidad,
        },
        "Acciones Registradas": detalle.acciones.map((accion, index) => ({
          "N°": accion.numero,
          "Tipo": accion.tipoAccion,
          "Descripción": accion.descripcionAccion,
          "Fecha Implementación": accion.fechaImplementacion,
          "Responsable": accion.responsableImplementacion,
          "Cierre": accion.cierre,
          "Fecha Cierre": accion.fechaCierre,
          "Observación": accion.observacion,
          "Evidencia": accion.evidencia,
        })),
      };

      console.log("JSON Reporte de Acciones SIG-FO05", registroDetallado);
      console.log("Objeto Completo:", [registro]);

      return sortRegistrosByRecent([registro, ...items], formatoActivo.consecutivoPrefix);
    });

    setSelectedRegistro(null);
    setActiveTab("historial");
    setIsCreateModalOpen(false);
  };

  const addUsuario = (usuario: UsuarioReporteAcciones) => {
    setUsuarios((items) => [...items, usuario]);
    setUsuarioActualId((current) => current || usuario.id);
  };

  const deleteUsuario = (usuarioId: string) => {
    if (usuarioActualId === usuarioId) {
      setUsuarioActualId("");
    }
    setUsuarios((items) => items.filter((item) => item.id !== usuarioId));
  };

  const deleteRegistro = (registroId: string) => {
    setRegistros((items) => items.filter((item) => item.id !== registroId));
    setSelectedRegistro((current) => (current?.id === registroId ? null : current));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <ReporteAccionesTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "historial" ? (
          <>
            <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-950 sm:text-3xl">Historial de Reportes de Acciones</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-800">
                      Código: {formatoActivo.codigo}
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                      Versión: {formatoActivo.version}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-emerald-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:w-fit"
                >
                  <Plus className="size-5" />
                  Crear Reporte de Acciones
                </button>
              </div>
            </header>

            <HistorialReporteAccionesTable registros={registrosOrdenados} onView={setSelectedRegistro} onDelete={deleteRegistro} />
            {selectedRegistro ? <DetalleReporteModal registro={selectedRegistro} onClose={() => setSelectedRegistro(null)} /> : null}
          </>
        ) : (
          <ConfiguracionReporteAccionesView
            usuarios={usuarios}
            empresaActiva={empresaActiva}
            codigoFormato={formatoActivo.codigo}
            usuarioActualId={usuarioActualId}
            onUsuarioActualChange={setUsuarioActualId}
            onAddUsuario={addUsuario}
            onDeleteUsuario={deleteUsuario}
          />
        )}
      </div>
      {isCreateModalOpen ? (
        <CrearReporteModal
          codigoFormato={formatoActivo.codigo}
          versionFormato={formatoActivo.version}
          usuarioActual={usuarioActual}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={createRegistro}
        />
      ) : null}
    </main>
  );
}
