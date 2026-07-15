"use client";

import { CheckCircle2, ClipboardList, Clock3, FileDown, FileText, Layers3, Plus, RotateCw, Send, X, XCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CalidadReporteAccionesView } from "./CalidadReporteAccionesView";
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
const usuariosIniciales: UsuarioReporteAcciones[] = [
  {
    id: "usuario-colaborador-demo",
    nombre: "Colaborador ROCA",
    correo: "colaborador@roca.local",
    empresa: "INCO",
    rol: "Colaborador",
    proceso: "Gestión de Calidad",
    activo: true,
  },
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
function getConsecutivoNumber(consecutivo: string, prefix: string) {
  const match = consecutivo.match(new RegExp(`^${prefix}-\\d{4}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
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
  usuarioActual,
}: {
  registro: ReporteAccionesRegistro;
  onClose: () => void;
  onUpdate: (registro: ReporteAccionesRegistro) => void;
  usuarioActual?: UsuarioReporteAcciones;
}) {
  const canImplement =
    registro.estado === "En implementación" ||
    registro.estado === "Pendiente de cierre por líder" ||
    registro.estado === "No eficaz / Requiere nueva acción";
  const canCorrect = registro.estado === "Devuelto para corrección";
  const canLeaderReview =
    registro.estado === "Pendiente aprobación líder" &&
    usuarioActual?.rol === "Líder de proceso" &&
    (registro.liderProcesoId === usuarioActual.id || registro.liderProceso === usuarioActual.nombre);
  const actionInputClass = "min-h-10 w-full rounded-md border border-slate-300 px-2 py-2 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

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
        validacionEficacia: {
          eficaz: null,
          fecha: "",
          observacion: "",
          evidencia: null,
          evidenciaNombre: "",
          decision: "",
          usuario: "",
        },
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

  const approveLeaderAndSendToQuality = () => {
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
            usuario: usuarioActual?.nombre ?? registro.liderProceso,
            rol: "Líder de proceso",
            accion: "Aprobó el líder y envió a Calidad",
            estadoAnterior: registro.estado,
            estadoNuevo: state,
            observacion: "El líder del proceso revisa el reporte y lo envía a Gestión de Calidad.",
          },
        ],
      },
    });
    onClose();
  };

  const returnFromLeader = () => {
    const observation = window.prompt("Observación para devolver el reporte al creador:")?.trim();
    if (!observation) return;
    const state = "Devuelto para corrección" as const;
    onUpdate({
      ...registro,
      estado: state,
      responsableActual: registro.creadorNombre ?? registro.detalle.usuarioCreador,
      detalle: {
        ...registro.detalle,
        estado: state,
        aprobadorActual: registro.creadorNombre ?? registro.detalle.usuarioCreador,
        observacionesCalidad: observation,
        historial: [
          ...(registro.detalle.historial ?? []),
          {
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            usuario: usuarioActual?.nombre ?? registro.liderProceso,
            rol: "Líder de proceso",
            accion: "Devolvió el líder para corrección",
            estadoAnterior: registro.estado,
            estadoNuevo: state,
            observacion: observation,
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
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">{registro.consecutivo}</p>
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
            <p>
              <span className="block text-xs font-black uppercase text-slate-500">Usuario creador</span>
              <span className="font-semibold text-slate-950">{registro.detalle.usuarioCreador || registro.liderProceso}</span>
            </p>
            <p>
              <span className="block text-xs font-black uppercase text-slate-500">Responsable eficacia</span>
              <span className="font-semibold text-slate-950">{registro.detalle.responsableValidarEficacia || "Pendiente por Calidad"}</span>
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
              <p className="text-xs font-black uppercase text-slate-500">Causa raíz</p>
              {canCorrect ? <textarea value={registro.detalle.causaRaiz} onChange={(event) => updateDetail({ causaRaiz: event.target.value })} className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm" /> : <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.causaRaiz}</p>}
            </div>
            <div className="rounded-md border border-slate-100 bg-white p-4">
              <p className="text-xs font-black uppercase text-slate-500">Metodología</p>
              {canCorrect ? <textarea value={registro.detalle.metodologiaAnalisis} onChange={(event) => updateDetail({ metodologiaAnalisis: event.target.value })} className="mt-2 min-h-24 w-full rounded-md border border-slate-300 p-3 text-sm" /> : <p className="mt-2 text-sm leading-6 text-slate-700">{registro.detalle.metodologiaAnalisis}</p>}
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
            <div className="bg-[#071127] px-4 py-3 text-sm font-black uppercase text-white">Acciones registradas</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="bg-[#111935] text-xs font-black uppercase text-white">
                  <tr>
                    <th className="px-4 py-3">N°</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Resultado esperado</th>
                    <th className="px-4 py-3">Evidencia requerida</th>
                    <th className="px-4 py-3">Fecha implementación</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Cierre y evidencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registro.detalle.acciones.map((accion) => (
                    <tr key={accion.id}>
                      <td className="px-4 py-3 font-black text-blue-700">{accion.numero}</td>
                      <td className="px-4 py-3 font-semibold">
                        {canCorrect ? (
                          <input value={accion.tipoAccion} onChange={(event) => updateAction(accion.id, { tipoAccion: event.target.value })} className={actionInputClass} />
                        ) : (
                          accion.tipoAccion
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canCorrect ? (
                          <textarea value={accion.descripcionAccion} onChange={(event) => updateAction(accion.id, { descripcionAccion: event.target.value })} className={actionInputClass} />
                        ) : (
                          accion.descripcionAccion
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canCorrect ? (
                          <textarea value={accion.resultadoEsperado} onChange={(event) => updateAction(accion.id, { resultadoEsperado: event.target.value })} className={actionInputClass} />
                        ) : (
                          accion.resultadoEsperado
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canCorrect ? (
                          <textarea value={accion.evidenciaRequerida} onChange={(event) => updateAction(accion.id, { evidenciaRequerida: event.target.value })} className={actionInputClass} />
                        ) : (
                          accion.evidenciaRequerida
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canCorrect ? (
                          <input type="date" value={accion.fechaImplementacion} onChange={(event) => updateAction(accion.id, { fechaImplementacion: event.target.value })} className={actionInputClass} />
                        ) : (
                          accion.fechaImplementacion
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {canCorrect ? (
                          <input value={accion.responsableImplementacion} onChange={(event) => updateAction(accion.id, { responsableImplementacion: event.target.value })} className={actionInputClass} />
                        ) : (
                          accion.responsableImplementacion
                        )}
                      </td>
                      <td className="min-w-72 px-4 py-3">
                        {canImplement ? (
                          <div className="space-y-2">
                            <select
                              value={accion.cierre}
                              onChange={(event) =>
                                updateAction(accion.id, {
                                  cierre: event.target.value as "Pendiente" | "Cerrado",
                                  estadoIndividual: event.target.value === "Cerrado" ? "Implementada" : "En implementación",
                                })
                              }
                              className="h-10 w-full rounded-md border border-slate-300 px-2"
                            >
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
              <button type="button" onClick={requestEffectivenessReview} className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-700">
                <Send className="size-4" /> Solicitar validación de eficacia
              </button>
            </div>
          ) : null}

          {canCorrect ? (
            <div className="flex justify-end">
              <button type="button" onClick={resendToQuality} className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-700">
                <Send className="size-4" /> Reenviar corrección a Calidad
              </button>
            </div>
          ) : null}

          {canLeaderReview ? (
            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <button type="button" onClick={returnFromLeader} className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 font-bold text-red-700 transition hover:bg-red-100">
                Devolver para corrección
              </button>
              <button type="button" onClick={approveLeaderAndSendToQuality} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-700">
                <Send className="size-4" /> Aprobar y enviar a Calidad
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
  lideresProceso,
  onClose,
  onSave,
}: {
  codigoFormato: string;
  versionFormato: string;
  usuarioActual?: UsuarioReporteAcciones;
  lideresProceso: UsuarioReporteAcciones[];
  onClose: () => void;
  onSave: (reporte: ReporteAccionesData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
      <section
        className="flex max-h-[92vh] min-w-0 flex-col overflow-hidden rounded-lg border border-[#dfe7f2] bg-white shadow-2xl"
        style={{ width: "72vw", minWidth: "960px", maxWidth: "calc(100vw - 48px)" }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#dfe7f2] bg-white px-7 py-5 sm:px-7">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black leading-8 text-[#34435e]">
              <ClipboardList className="size-7 text-[#536784]" />
              Nuevo Reporte de Acciones
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-6 text-[#536784]">
              Diligencia la identificación del hallazgo, registra el análisis y agrega las acciones de implementación y control.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-grid size-10 shrink-0 place-items-center rounded-md bg-white text-[#536784] transition hover:bg-slate-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Cerrar creación"
            title="Cerrar"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-w-0 flex-1 overflow-y-auto bg-[#f3f8ff] px-4 py-5 sm:px-7 sm:py-8">
          <div className="mx-auto min-w-0" style={{ width: "calc(100% - 56px)", maxWidth: "1228px" }}>
            <ReporteAccionesForm codigoFormato={codigoFormato} versionFormato={versionFormato} usuarioActual={usuarioActual} lideresProceso={lideresProceso} onSave={onSave} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function ReporteAccionesPage() {
  const [activeTab, setActiveTab] = useState<ReporteAccionesTab>("historial");
  const [registros, setRegistros] = useState<ReporteAccionesRegistro[]>(registrosIniciales);
  const [usuarios, setUsuarios] = useState<UsuarioReporteAcciones[]>(usuariosIniciales);
  const [usuarioActualId, setUsuarioActualId] = useState("usuario-colaborador-demo");
  const [selectedRegistro, setSelectedRegistro] = useState<ReporteAccionesRegistro | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  const formatoActivo = formatosPorEmpresa[empresaActiva];
  const usuarioActual = useMemo(() => usuarios.find((usuario) => usuario.id === usuarioActualId && usuario.activo), [usuarioActualId, usuarios]);
  const lideresProceso = useMemo(
    () => usuarios.filter((usuario) => usuario.empresa === empresaActiva && usuario.rol === "Líder de proceso" && usuario.activo),
    [usuarios],
  );
  const registrosOrdenados = useMemo(() => sortRegistrosByRecent(registros, formatoActivo.consecutivoPrefix), [formatoActivo.consecutivoPrefix, registros]);
  const resumen = useMemo(
    () => ({
      total: registrosOrdenados.length,
      cerrados: registrosOrdenados.filter((registro) => registro.estado === "Cerrado").length,
      enImplementacion: registrosOrdenados.filter((registro) => registro.estado === "En implementación" || registro.estado === "Pendiente de cierre por líder").length,
      pendientes: registrosOrdenados.filter((registro) => registro.estado === "En revisión de Calidad" || registro.estado === "En validación de eficacia").length,
      devueltos: registrosOrdenados.filter((registro) => registro.estado === "Devuelto para corrección" || registro.estado === "No eficaz / Requiere nueva acción").length,
    }),
    [registrosOrdenados],
  );

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const response = await fetch("/api/reporte-acciones", { cache: "no-store" });
        const payload = (await response.json()) as {
          usuarios?: UsuarioReporteAcciones[];
          registros?: ReporteAccionesRegistro[];
          error?: string;
        };

        if (!response.ok) throw new Error(payload.error ?? "No fue posible cargar los reportes.");
        if (!active) return;
        setUsuarios(payload.usuarios?.length ? payload.usuarios : usuariosIniciales);
        setRegistros(payload.registros ?? []);
      } catch (error) {
        if (!active) return;
        setSaveError(error instanceof Error ? error.message : "No fue posible cargar los reportes.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const createRegistro = async (data: ReporteAccionesData) => {
    const detalle = { ...cloneReporteData(data), codigo: formatoActivo.codigo, version: formatoActivo.version };
    setSaveError("");

    try {
      const response = await fetch("/api/reporte-acciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "create-report", userId: usuarioActual?.id, data: detalle }),
      });
      const payload = (await response.json()) as { registro?: ReporteAccionesRegistro; error?: string };
      if (!response.ok || !payload.registro) throw new Error(payload.error ?? "No fue posible guardar el reporte.");

      setRegistros((items) => sortRegistrosByRecent([payload.registro!, ...items], formatoActivo.consecutivoPrefix));
      setSelectedRegistro(null);
      setActiveTab("historial");
      setIsCreateModalOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No fue posible guardar el reporte.");
    }
  };

  const updateRegistro = async (registro: ReporteAccionesRegistro) => {
    setSaveError("");
    setRegistros((items) => items.map((item) => (item.id === registro.id ? registro : item)));
    setSelectedRegistro((current) => (current?.id === registro.id ? registro : current));

    try {
      const response = await fetch("/api/reporte-acciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "update-report", registro }),
      });
      const payload = (await response.json()) as { registro?: ReporteAccionesRegistro; error?: string };
      if (!response.ok || !payload.registro) throw new Error(payload.error ?? "No fue posible actualizar el reporte.");

      setRegistros((items) => items.map((item) => (item.id === payload.registro!.id ? payload.registro! : item)));
      setSelectedRegistro((current) => (current?.id === payload.registro!.id ? payload.registro! : current));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "No fue posible actualizar el reporte.");
    }
  };

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-4 text-[#071127] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1360px] space-y-5">
        <ReporteAccionesTabs activeTab={activeTab} onChange={setActiveTab} />
        {saveError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700 shadow-sm">{saveError}</div>
        ) : null}
        {isLoading ? (
          <section className="rounded-lg border border-[#d8e2ee] bg-white p-10 text-center shadow-sm">
            <p className="font-black text-[#071127]">Cargando reportes de acciones...</p>
          </section>
        ) : null}

        {!isLoading && activeTab === "historial" ? (
          <>
            <header className="overflow-hidden rounded-lg bg-[#111935] text-white shadow-lg shadow-slate-400/30 ring-1 ring-indigo-200">
              <div className="flex flex-col gap-5 bg-[radial-gradient(circle_at_82%_0%,rgba(61,72,140,0.62),transparent_34%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 text-white shadow-inner">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white sm:text-2xl">Reporte de Acciones SIG-F005</h1>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
                      Revisión, implementación y validación de eficacia de acciones correctivas y de mejora.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-slate-100">
                        Código: {formatoActivo.codigo}
                      </span>
                      <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-slate-100">
                        Versión: {formatoActivo.version}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 sm:w-fit"
                >
                  <Plus className="size-4" />
                  Crear Reporte de Acciones
                </button>
              </div>
            </header>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Total", value: resumen.total, icon: Layers3, className: "from-white to-slate-100 text-[#08142f]", iconClassName: "bg-slate-100 text-slate-600" },
                { label: "Cerradas", value: resumen.cerrados, icon: CheckCircle2, className: "from-emerald-50 to-white text-emerald-700", iconClassName: "bg-emerald-100 text-emerald-700" },
                { label: "En implementación", value: resumen.enImplementacion, icon: RotateCw, className: "from-violet-50 to-white text-violet-700", iconClassName: "bg-violet-100 text-violet-700" },
                { label: "Pendientes", value: resumen.pendientes, icon: Clock3, className: "from-amber-50 to-white text-amber-700", iconClassName: "bg-amber-100 text-amber-700" },
                { label: "Devueltas", value: resumen.devueltos, icon: XCircle, className: "from-red-50 to-white text-red-700", iconClassName: "bg-red-100 text-red-700" },
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

            <HistorialReporteAccionesTable registros={registrosOrdenados} onView={setSelectedRegistro} />
            {selectedRegistro ? <DetalleReporteModal registro={selectedRegistro} usuarioActual={usuarioActual} onClose={() => setSelectedRegistro(null)} onUpdate={updateRegistro} /> : null}
          </>
        ) : !isLoading && activeTab === "aprobacion" ? (
          <CalidadReporteAccionesView mode="aprobacion" registros={registrosOrdenados} onUpdate={updateRegistro} />
        ) : !isLoading ? (
          activeTab === "eficacia" ? (
          <CalidadReporteAccionesView mode="eficacia" registros={registrosOrdenados} onUpdate={updateRegistro} />
          ) : (
            <ConfiguracionReporteAccionesView
              usuarios={usuarios}
              empresaActiva={empresaActiva}
              codigoFormato={formatoActivo.codigo}
              usuarioActualId={usuarioActualId}
              onUsuarioActualChange={setUsuarioActualId}
              onAddUsuario={(usuario) => setUsuarios((items) => [...items, usuario])}
              onDeleteUsuario={(usuarioId) => setUsuarios((items) => items.filter((item) => item.id !== usuarioId))}
            />
          )
        ) : null}
      </div>
      {isCreateModalOpen ? (
        <CrearReporteModal
          codigoFormato={formatoActivo.codigo}
          versionFormato={formatoActivo.version}
          usuarioActual={usuarioActual}
          lideresProceso={lideresProceso}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={createRegistro}
        />
      ) : null}
    </main>
  );
}
