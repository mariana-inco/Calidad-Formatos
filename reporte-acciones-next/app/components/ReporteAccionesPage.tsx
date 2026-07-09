"use client";

import { FileDown, Plus, Send, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CalidadReporteAccionesView } from "./CalidadReporteAccionesView";
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
const usuariosIniciales: UsuarioReporteAcciones[] = [
  {
    id: "usuario-lider-demo",
    nombre: "Líder de proceso",
    correo: "lider.proceso@roca.local",
    empresa: "INCO",
    rol: "Líder de proceso",
    proceso: "Gestión de Calidad",
    activo: true,
  },
];
const STORAGE_KEY = "roca-reporte-acciones-sig-f005";

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

function DetalleReporteModal({
  registro,
  onClose,
  onUpdate,
}: {
  registro: ReporteAccionesRegistro;
  onClose: () => void;
  onUpdate: (registro: ReporteAccionesRegistro) => void;
}) {
  const canImplement =
    registro.estado === "En implementación" ||
    registro.estado === "Pendiente de cierre por líder" ||
    registro.estado === "No eficaz / Requiere nueva acción";
  const canCorrect = registro.estado === "Devuelto para corrección";

  const updateDetail = (fields: Partial<ReporteAccionesRegistro["detalle"]>) => {
    onUpdate({ ...registro, detalle: { ...registro.detalle, ...fields } });
  };

  const updateAction = (actionId: string, fields: Partial<ReporteAccionesRegistro["detalle"]["acciones"][number]>) => {
    onUpdate({
      ...registro,
      detalle: {
        ...registro.detalle,
        acciones: registro.detalle.acciones.map((action) => (action.id === actionId ? { ...action, ...fields } : action)),
      },
    });
  };

  const readEvidence = (actionId: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateAction(actionId, { evidencia: String(reader.result), evidenciaNombre: file.name });
    reader.readAsDataURL(file);
  };

  const requestEffectivenessReview = () => {
    const incomplete = registro.detalle.acciones.some(
      (action) => action.cierre !== "Cerrado" || !action.fechaCierre || (!action.evidencia && !action.justificacionSinEvidencia?.trim()),
    );
    if (incomplete) {
      window.alert("Todas las acciones deben estar cerradas, tener fecha y contar con evidencia o justificación.");
      return;
    }
    const state = "En validación de eficacia" as const;
    onUpdate({
      ...registro,
      estado: state,
      responsableActual: "Gestión de Calidad",
      detalle: {
        ...registro.detalle,
        estado: state,
        aprobadorActual: "Gestión de Calidad",
        historial: [
          ...(registro.detalle.historial ?? []),
          {
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            usuario: registro.liderProceso,
            rol: "Líder de proceso",
            accion: "Solicitó validación de eficacia",
            estadoAnterior: registro.estado,
            estadoNuevo: state,
            observacion: "Acciones cerradas y evidencias remitidas a Calidad.",
          },
        ],
      },
    });
    onClose();
  };

  const resendToQuality = () => {
    const state = "En revisión de Calidad" as const;
    onUpdate({
      ...registro,
      estado: state,
      responsableActual: "Gestión de Calidad",
      detalle: {
        ...registro.detalle,
        estado: state,
        aprobadorActual: "Gestión de Calidad",
        historial: [
          ...(registro.detalle.historial ?? []),
          {
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            usuario: registro.liderProceso,
            rol: "Líder de proceso",
            accion: "Corrigió y reenvió el reporte",
            estadoAnterior: registro.estado,
            estadoNuevo: state,
            observacion: "Se atendieron las observaciones de Gestión de Calidad.",
          },
        ],
      },
    });
    onClose();
  };

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
            <div className="flex gap-2">
              <button type="button" onClick={() => window.print()} className="inline-grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600" title="Imprimir o guardar PDF">
                <FileDown className="size-4" />
              </button>
              <button type="button" onClick={onClose} className="inline-grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600" aria-label="Cerrar detalle" title="Cerrar">
                <X className="size-4" />
              </button>
            </div>
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
              {canCorrect ? (
                <textarea value={registro.detalle.descripcionHallazgo} onChange={(event) => updateDetail({ descripcionHallazgo: event.target.value })} className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm" />
              ) : <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.descripcionHallazgo}</p>}
            </div>
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Causas</p>
              {canCorrect ? <textarea value={registro.detalle.causas} onChange={(event) => updateDetail({ causas: event.target.value })} className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm" /> : <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.causas}</p>}
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
                    <th className="px-4 py-3">Cierre y evidencia</th>
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
                      <td className="min-w-72 px-4 py-3">
                        {canImplement ? (
                          <div className="space-y-2">
                            <select value={accion.cierre} onChange={(event) => updateAction(accion.id, { cierre: event.target.value as "Pendiente" | "Cerrado" })} className="h-10 w-full rounded-md border border-slate-300 px-2">
                              <option>Pendiente</option><option>Cerrado</option>
                            </select>
                            <input type="date" value={accion.fechaCierre} onChange={(event) => updateAction(accion.id, { fechaCierre: event.target.value })} className="h-10 w-full rounded-md border border-slate-300 px-2" />
                            <textarea value={accion.observacion} onChange={(event) => updateAction(accion.id, { observacion: event.target.value })} placeholder="Observación de cierre" className="min-h-16 w-full rounded-md border border-slate-300 p-2" />
                            <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(event) => readEvidence(accion.id, event.target.files?.[0])} className="block w-full text-xs" />
                            {accion.evidenciaNombre ? <p className="text-xs font-bold text-emerald-700">{accion.evidenciaNombre}</p> : null}
                            <input value={accion.justificacionSinEvidencia ?? ""} onChange={(event) => updateAction(accion.id, { justificacionSinEvidencia: event.target.value })} placeholder="Justificación si no hay evidencia" className="h-10 w-full rounded-md border border-slate-300 px-2 text-xs" />
                          </div>
                        ) : (
                          <div><p className="font-semibold">{accion.cierre}</p>{accion.evidenciaNombre ? <p className="text-xs text-emerald-700">{accion.evidenciaNombre}</p> : null}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {canImplement ? (
            <div className="flex justify-end">
              <button type="button" onClick={requestEffectivenessReview} className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-800 px-5 font-bold text-white">
                <Send className="size-4" /> Solicitar validación de eficacia
              </button>
            </div>
          ) : null}

          {canCorrect ? (
            <div className="flex justify-end">
              <button type="button" onClick={resendToQuality} className="inline-flex h-11 items-center gap-2 rounded-md bg-emerald-800 px-5 font-bold text-white">
                <Send className="size-4" /> Reenviar corrección a Calidad
              </button>
            </div>
          ) : null}

          <section>
            <h3 className="text-sm font-black uppercase text-slate-800">Trazabilidad</h3>
            <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
              {(registro.detalle.historial ?? []).map((item) => (
                <div key={item.id} className="grid gap-1 p-3 text-sm md:grid-cols-[180px_1fr_1fr]">
                  <span className="text-xs text-slate-500">{new Date(item.fecha).toLocaleString("es-CO")}</span>
                  <span className="font-bold">{item.accion}</span>
                  <span className="text-slate-600">{item.observacion || `${item.estadoAnterior ?? "Inicio"} → ${item.estadoNuevo}`}</span>
                </div>
              ))}
            </div>
          </section>

          {registro.detalle.revisiones?.length ? (
            <section>
              <h3 className="text-sm font-black uppercase text-slate-800">Aprobaciones y firmas</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {registro.detalle.revisiones.map((review) => (
                  <article key={review.id} className="rounded-md border border-slate-200 p-4">
                    <p className="font-black">{review.decision}</p>
                    <p className="text-sm text-slate-600">{review.usuario} · {new Date(review.fecha).toLocaleString("es-CO")}</p>
                    <div className="relative mt-3 h-20"><Image src={review.firma} alt={`Firma de ${review.usuario}`} fill unoptimized className="object-contain" /></div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
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
  const [usuarios] = useState<UsuarioReporteAcciones[]>(usuariosIniciales);
  const [usuarioActualId] = useState("usuario-lider-demo");
  const [selectedRegistro, setSelectedRegistro] = useState<ReporteAccionesRegistro | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const formatoActivo = formatosPorEmpresa[empresaActiva];
  const usuarioActual = useMemo(() => usuarios.find((usuario) => usuario.id === usuarioActualId && usuario.activo), [usuarioActualId, usuarios]);
  const registrosOrdenados = useMemo(() => sortRegistrosByRecent(registros, formatoActivo.consecutivoPrefix), [formatoActivo.consecutivoPrefix, registros]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setRegistros(JSON.parse(stored) as ReporteAccionesRegistro[]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
  }, [hydrated, registros]);

  const createRegistro = (data: ReporteAccionesData) => {
    const detalle = { ...cloneReporteData(data), codigo: formatoActivo.codigo, version: formatoActivo.version };

    setRegistros((items) => {
      const registro: ReporteAccionesRegistro = {
        id: crypto.randomUUID(),
        consecutivo: getNextConsecutivo(items, formatoActivo.consecutivoPrefix),
        fechaCreacion: new Date().toISOString(),
        liderProceso: usuarioActual?.nombre || "Líder de proceso",
        proceso: detalle.proceso || "Sin diligenciar",
        tipoHallazgo: detalle.tipoHallazgo || "Sin diligenciar",
        estado: detalle.estado,
        responsableActual: detalle.aprobadorActual,
        detalle: {
          ...detalle,
          historial: [
            {
              id: crypto.randomUUID(),
              fecha: new Date().toISOString(),
              usuario: usuarioActual?.nombre || "Líder de proceso",
              rol: usuarioActual?.rol || "Líder de proceso",
              accion: "Creó y envió el reporte a Calidad",
              estadoAnterior: "Borrador",
              estadoNuevo: "En revisión de Calidad",
              observacion: "Reporte enviado para revisión inicial.",
            },
          ],
          revisiones: [],
          validacionEficacia: {
            eficaz: null,
            fecha: "",
            observacion: "",
            evidencia: null,
            evidenciaNombre: "",
            decision: "",
            usuario: "",
          },
        },
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
        "Acciones Registradas": detalle.acciones.map((accion) => ({
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

  const updateRegistro = (registro: ReporteAccionesRegistro) => {
    setRegistros((items) => items.map((item) => (item.id === registro.id ? registro : item)));
    setSelectedRegistro((current) => (current?.id === registro.id ? registro : current));
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

            <HistorialReporteAccionesTable registros={registrosOrdenados} onView={setSelectedRegistro} />
            {selectedRegistro ? <DetalleReporteModal registro={selectedRegistro} onClose={() => setSelectedRegistro(null)} onUpdate={updateRegistro} /> : null}
          </>
        ) : activeTab === "aprobacion" ? (
          <CalidadReporteAccionesView mode="aprobacion" registros={registrosOrdenados} onUpdate={updateRegistro} />
        ) : (
          <CalidadReporteAccionesView mode="eficacia" registros={registrosOrdenados} onUpdate={updateRegistro} />
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
