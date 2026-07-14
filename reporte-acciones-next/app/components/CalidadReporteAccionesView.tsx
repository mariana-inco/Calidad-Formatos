"use client";

import { CheckCircle2, Eye, RotateCcw, Search, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SignaturePad } from "./SignaturePad";
import type { ReporteAccionesRegistro, ReporteEstado, ReporteRevision } from "./types";

type Mode = "aprobacion" | "eficacia";

const inputClass = "h-11 w-full rounded-md border border-[#cbd6e4] bg-white px-3 text-sm font-semibold text-[#071127] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const textareaClass = "min-h-24 w-full resize-y rounded-md border border-[#cbd6e4] bg-white p-3 text-sm font-semibold text-[#071127] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

function now() {
  return new Date().toISOString();
}

function addHistory(
  registro: ReporteAccionesRegistro,
  estado: ReporteEstado,
  action: string,
  observation: string,
) {
  return [
    ...(registro.detalle.historial ?? []),
    {
      id: crypto.randomUUID(),
      fecha: now(),
      usuario: "Gestión de Calidad",
      rol: "Gestión de Calidad",
      accion: action,
      estadoAnterior: registro.estado,
      estadoNuevo: estado,
      observacion: observation,
    },
  ];
}

export function CalidadReporteAccionesView({
  mode,
  registros,
  onUpdate,
}: {
  mode: Mode;
  registros: ReporteAccionesRegistro[];
  onUpdate: (registro: ReporteAccionesRegistro) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReporteAccionesRegistro | null>(null);
  const [observation, setObservation] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [effectivenessOwner, setEffectivenessOwner] = useState("");
  const [signature, setSignature] = useState("");
  const [effective, setEffective] = useState<boolean | null>(null);
  const [decision, setDecision] = useState<"" | "Cerrar reporte" | "Reabrir acción" | "Crear nueva acción">("");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [evidenceName, setEvidenceName] = useState("");
  const [error, setError] = useState("");

  const expectedState: ReporteEstado = mode === "aprobacion" ? "En revisión de Calidad" : "En validación de eficacia";
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return registros.filter(
      (item) =>
        item.estado === expectedState &&
        (!term || [item.consecutivo, item.liderProceso, item.proceso, item.tipoHallazgo].some((value) => value.toLowerCase().includes(term))),
    );
  }, [expectedState, registros, search]);

  const close = () => {
    setSelected(null);
    setObservation("");
    setFollowupDate("");
    setEffectivenessOwner("");
    setSignature("");
    setEffective(null);
    setDecision("");
    setEvidence(null);
    setEvidenceName("");
    setError("");
  };

  const saveReview = (approved: boolean) => {
    if (!selected) return;
    if (!approved && !observation.trim()) {
      setError("La observación es obligatoria para devolver el reporte.");
      return;
    }
    if (approved && !followupDate) {
      setError("Define la fecha de seguimiento de eficacia antes de aprobar.");
      return;
    }
    if (approved && !effectivenessOwner.trim()) {
      setError("Define el responsable de validar la eficacia antes de aprobar.");
      return;
    }
    if (!signature) {
      setError("Gestión de Calidad debe firmar la decisión.");
      return;
    }

    const state: ReporteEstado = approved ? "En implementación" : "Devuelto para corrección";
    const review: ReporteRevision = {
      id: crypto.randomUUID(),
      usuario: "Gestión de Calidad",
      cargo: "Gestión de Calidad",
      rol: "Gestión de Calidad",
      decision: approved ? "Aprobado por Calidad" : "Devuelto para corrección",
      comprende: true,
      observacion: observation.trim(),
      firma: signature,
      fecha: now(),
    };
    onUpdate({
      ...selected,
      estado: state,
      responsableActual: selected.liderProceso,
      detalle: {
        ...selected.detalle,
        estado: state,
        aprobadorActual: selected.liderProceso,
        fechaSeguimientoEficacia: approved ? followupDate : selected.detalle.fechaSeguimientoEficacia,
        responsableValidarEficacia: approved ? effectivenessOwner.trim() : selected.detalle.responsableValidarEficacia,
        observacionesCalidad: observation.trim(),
        revisiones: [...(selected.detalle.revisiones ?? []), review],
        historial: addHistory(selected, state, approved ? "Aprobó el reporte" : "Devolvió para corrección", observation.trim()),
      },
    });
    close();
  };

  const readEvidence = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEvidence(String(reader.result));
      setEvidenceName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const saveEffectiveness = () => {
    if (!selected) return;
    if (effective === null || !observation.trim() || !decision || !signature) {
      setError("Completa el resultado, la observación, la decisión y la firma.");
      return;
    }
    if (effective && decision !== "Cerrar reporte") {
      setError("Una acción eficaz debe finalizar con la decisión Cerrar reporte.");
      return;
    }
    if (!effective && decision === "Cerrar reporte") {
      setError("Una acción no eficaz debe reabrirse o generar una nueva acción.");
      return;
    }

    const state: ReporteEstado = effective ? "Cerrado" : "No eficaz / Requiere nueva acción";
    const review: ReporteRevision = {
      id: crypto.randomUUID(),
      usuario: "Gestión de Calidad",
      cargo: "Gestión de Calidad",
      rol: "Gestión de Calidad",
      decision,
      comprende: true,
      observacion: observation.trim(),
      firma: signature,
      fecha: now(),
    };
    onUpdate({
      ...selected,
      estado: state,
      responsableActual: effective ? "Gestión de Calidad" : selected.liderProceso,
      detalle: {
        ...selected.detalle,
        estado: state,
        aprobadorActual: effective ? "Gestión de Calidad" : selected.liderProceso,
        acciones: effective
          ? selected.detalle.acciones
          : selected.detalle.acciones.map((item) => ({
              ...item,
              cierre: "Pendiente" as const,
              fechaCierre: "",
              observacion: "",
              evidencia: null,
              evidenciaNombre: "",
            })),
        validacionEficacia: {
          eficaz: effective,
          fecha: now(),
          observacion: observation.trim(),
          evidencia: evidence,
          evidenciaNombre: evidenceName,
          decision,
          usuario: "Gestión de Calidad",
        },
        revisiones: [...(selected.detalle.revisiones ?? []), review],
        historial: addHistory(selected, state, effective ? "Validó eficacia y cerró" : decision, observation.trim()),
      },
    });
    close();
  };

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-lg bg-[#111935] text-white shadow-lg shadow-slate-400/30 ring-1 ring-indigo-200">
        <div className="flex items-center gap-4 bg-[radial-gradient(circle_at_82%_0%,rgba(61,72,140,0.62),transparent_34%)] px-5 py-5 sm:px-7">
          <span className="grid size-12 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 text-white shadow-inner">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-black text-white sm:text-2xl">
              {mode === "aprobacion" ? "Revisión de Reportes de Acciones" : "Validación de Eficacia"}
            </h1>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
              {mode === "aprobacion"
                ? "Reportes enviados a Gestión de Calidad para revisión inicial."
                : "Reportes implementados que requieren comprobar su eficacia."}
            </p>
          </div>
        </div>
      </header>

      <label className="relative block">
        <Search className="absolute left-4 top-3.5 size-5 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código, líder, proceso o hallazgo" className={`${inputClass} pl-12`} />
      </label>

      {filtered.length ? (
        <div className="overflow-hidden rounded-lg border border-[#d8e2ee] bg-white shadow-sm">
          {filtered.map((registro) => (
            <article key={registro.id} className="grid gap-4 border-b border-slate-100 p-5 last:border-0 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
              <div>
                <p className="inline-flex rounded-md bg-[#071127] px-3 py-1.5 text-xs font-black text-white">{registro.consecutivo}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(registro.fechaCreacion).toLocaleString("es-CO")}</p>
              </div>
              <div><p className="text-xs font-black uppercase text-slate-500">Proceso</p><p className="font-semibold">{registro.proceso}</p></div>
              <div><p className="text-xs font-black uppercase text-slate-500">Líder</p><p className="font-semibold">{registro.liderProceso}</p></div>
              <button type="button" onClick={() => setSelected(registro)} className="grid size-10 place-items-center rounded-md border border-[#cbd6e4] text-[#34435e] transition hover:border-blue-500 hover:text-blue-700" title="Revisar">
                <Eye className="size-5" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#cbd6e4] bg-white p-10 text-center shadow-sm">
          <p className="font-black text-[#071127]">No hay reportes pendientes en esta bandeja</p>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-3">
          <section className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">
              <div><p className="text-xs font-black text-blue-700">{selected.consecutivo}</p><h2 className="text-xl font-black">Revisión de Calidad</h2></div>
              <button type="button" onClick={close} className="grid size-10 place-items-center rounded-md border border-slate-300"><X className="size-5" /></button>
            </header>
            <div className="space-y-6 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div><p className="text-xs font-black uppercase text-slate-500">Hallazgo</p><p className="mt-1 text-sm">{selected.detalle.descripcionHallazgo}</p></div>
                <div><p className="text-xs font-black uppercase text-slate-500">Causa</p><p className="mt-1 text-sm">{selected.detalle.causas}</p></div>
                <div><p className="text-xs font-black uppercase text-slate-500">Acciones</p><p className="mt-1 text-sm font-bold">{selected.detalle.acciones.length} registradas</p></div>
              </div>

              {mode === "aprobacion" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block"><span className="text-xs font-black uppercase text-slate-600">Fecha de seguimiento de eficacia</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} className={`mt-2 ${inputClass}`} /></label>
                  <label className="block"><span className="text-xs font-black uppercase text-slate-600">Responsable de validar eficacia</span><input value={effectivenessOwner} onChange={(e) => setEffectivenessOwner(e.target.value)} placeholder="Nombre del responsable" className={`mt-2 ${inputClass}`} /></label>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-black uppercase text-slate-600">¿La acción fue eficaz?</p>
                    <div className="mt-2 flex gap-3">
                      <button type="button" onClick={() => setEffective(true)} className={`h-11 rounded-md border px-5 font-bold ${effective === true ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-300"}`}>Sí</button>
                      <button type="button" onClick={() => setEffective(false)} className={`h-11 rounded-md border px-5 font-bold ${effective === false ? "border-red-700 bg-red-50 text-red-800" : "border-slate-300"}`}>No</button>
                    </div>
                  </div>
                  <label className="block"><span className="text-xs font-black uppercase text-slate-600">Evidencia de validación</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={(e) => readEvidence(e.target.files?.[0])} className={`mt-2 ${inputClass} py-2`} /></label>
                  <label className="block"><span className="text-xs font-black uppercase text-slate-600">Decisión final</span><select value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)} className={`mt-2 ${inputClass}`}><option value="">Seleccionar</option><option>Cerrar reporte</option><option>Reabrir acción</option><option>Crear nueva acción</option></select></label>
                </>
              )}

              <label className="block"><span className="text-xs font-black uppercase text-slate-600">Observación</span><textarea value={observation} onChange={(e) => setObservation(e.target.value)} className={`mt-2 ${textareaClass}`} /></label>
              <SignaturePad value={signature} label="Firma de Gestión de Calidad" onChange={setSignature} />
              {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}

              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                {mode === "aprobacion" ? (
                  <>
                    <button type="button" onClick={() => saveReview(false)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-red-300 px-5 font-bold text-red-700"><RotateCcw className="size-4" /> Solicitar corrección</button>
                    <button type="button" onClick={() => saveReview(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-700"><CheckCircle2 className="size-4" /> Aprobar</button>
                  </>
                ) : (
                  <button type="button" onClick={saveEffectiveness} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 font-bold text-white transition hover:bg-blue-700"><ShieldCheck className="size-4" /> Guardar validación</button>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
