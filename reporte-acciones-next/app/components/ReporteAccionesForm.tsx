"use client";

import { CalendarDays, ClipboardList, FileText, Hash, ListChecks, Save, Search, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AccionForm, emptyAccionForm, type AccionFormState } from "./AccionForm";
import { AccionesTable } from "./AccionesTable";
import { DynamicSelect } from "./DynamicSelect";
import { Field, inputClassName, textareaClassName } from "./Field";
import { SectionWrapper } from "./SectionWrapper";
import { fuentesPorTipoHallazgo, procesos, tiposHallazgo } from "./reporteAccionesData";
import type { ReporteAccion, ReporteAccionFlujo, ReporteAccionesData, TipoHallazgo, UsuarioReporteAcciones } from "./types";

function createEmptyReporte(codigo: string, version: string): ReporteAccionesData {
  return {
    codigo,
    nombre: "REPORTE DE ACCIONES",
    procesoFormato: "GESTION DE CALIDAD",
    fechaFormato: "2025-10-01",
    version,
    proceso: "",
    fechaHallazgo: "",
    tipoHallazgo: "",
    fuente: "Seleccione una opción",
    descripcionHallazgo: "",
    usuarioCreador: "",
    causas: "",
    descripcionProblema: "",
    metodologiaAnalisis: "",
    causasIdentificadas: "",
    causaRaiz: "",
    observacionesAnalisis: "",
    consecuencias: "",
    riesgosOportunidades: "",
    estado: "Borrador",
    aprobadorActual: "Líder de proceso",
    fechaSeguimientoEficacia: "",
    responsableValidarEficacia: "",
    observacionesCalidad: "",
    acciones: [],
  };
}

const fasesReporte = ["Identificación del Hallazgo", "Análisis de Causa", "Implementación"] as const;

function PhaseStepper({ activeStep }: { activeStep: number }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#d8e2ee] bg-white px-5 py-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {fasesReporte.map((fase, index) => {
          const isActive = index <= activeStep;

          return (
            <div key={fase} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-black transition ${
                  isActive ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-400"
                }`}
              >
                {index + 1}
              </div>
              <p className={`truncate text-sm font-black ${isActive ? "text-[#071127]" : "text-slate-400"}`}>{fase}</p>
              {index < fasesReporte.length - 1 ? <div className="hidden h-px flex-1 bg-slate-200 md:block" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ReporteAccionesFormProps = {
  codigoFormato: string;
  versionFormato: string;
  usuarioActual?: UsuarioReporteAcciones;
  onSave?: (reporte: ReporteAccionesData) => void;
};

export function ReporteAccionesForm({ codigoFormato, versionFormato, usuarioActual, onSave }: ReporteAccionesFormProps) {
  const [reporte, setReporte] = useState<ReporteAccionesData>(() => createEmptyReporte(codigoFormato, versionFormato));
  const [accionForm, setAccionForm] = useState<AccionFormState>(emptyAccionForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [accionError, setAccionError] = useState("");
  const [formError, setFormError] = useState("");
  const esCalidad = usuarioActual?.rol === "Calidad";

  const fuentes = useMemo(() => {
    if (!reporte.tipoHallazgo) return ["Seleccione una opción"];
    return fuentesPorTipoHallazgo[reporte.tipoHallazgo];
  }, [reporte.tipoHallazgo]);

  const updateReporte = <K extends keyof ReporteAccionesData>(key: K, value: ReporteAccionesData[K]) => {
    setReporte((current) => ({ ...current, [key]: value }));
  };

  const handleTipoHallazgoChange = (value: string) => {
    setReporte((current) => ({
      ...current,
      tipoHallazgo: value as TipoHallazgo,
      fuente: "Seleccione una opción",
    }));
  };

  const validateAccion = () => {
    if (
      accionForm.tipoAccion === "Seleccione una opción" ||
      !accionForm.descripcionAccion.trim() ||
      !accionForm.fechaImplementacion ||
      !accionForm.responsableImplementacion.trim() ||
      !accionForm.resultadoEsperado.trim() ||
      !accionForm.evidenciaRequerida.trim()
    ) {
      if (accionForm.tipoAccion === "Seleccione una opción") return "Falta diligenciar el campo: Tipo de acción.";
      if (!accionForm.descripcionAccion.trim()) return "Falta diligenciar el campo: Descripción de la acción.";
      if (!accionForm.fechaImplementacion) return "Falta diligenciar el campo: Fecha prevista de implementación.";
      if (!accionForm.responsableImplementacion.trim()) return "Falta diligenciar el campo: Responsable.";
      if (!accionForm.resultadoEsperado.trim()) return "Falta diligenciar el campo: Resultado esperado.";
      if (!accionForm.evidenciaRequerida.trim()) return "Falta diligenciar el campo: Evidencia requerida.";
    }

    return "";
  };

  const saveAccion = () => {
    const error = validateAccion();
    if (error) {
      setAccionError(error);
      return;
    }

    setAccionError("");
    setReporte((current) => {
      if (editingId) {
        return {
          ...current,
          acciones: current.acciones.map((accion) =>
            accion.id === editingId
              ? {
                  ...accion,
                  tipoAccion: accionForm.tipoAccion,
                  descripcionAccion: accionForm.descripcionAccion.trim(),
                  fechaImplementacion: accionForm.fechaImplementacion,
                  responsableImplementacion: accionForm.responsableImplementacion.trim(),
                  resultadoEsperado: accionForm.resultadoEsperado.trim(),
                  evidenciaRequerida: accionForm.evidenciaRequerida.trim(),
                  observaciones: accionForm.observaciones.trim(),
                }
              : accion,
          ),
        };
      }

      const nuevaAccion: ReporteAccion = {
        id: crypto.randomUUID(),
        numero: current.acciones.length + 1,
        tipoAccion: accionForm.tipoAccion,
        descripcionAccion: accionForm.descripcionAccion.trim(),
        fechaImplementacion: accionForm.fechaImplementacion,
        responsableImplementacion: accionForm.responsableImplementacion.trim(),
        resultadoEsperado: accionForm.resultadoEsperado.trim(),
        evidenciaRequerida: accionForm.evidenciaRequerida.trim(),
        observaciones: accionForm.observaciones.trim(),
        estadoIndividual: "Pendiente",
        cierre: "Pendiente",
        fechaCierre: "",
        observacion: "",
        evidencia: null,
      };

      return {
        ...current,
        acciones: [...current.acciones, nuevaAccion],
      };
    });

    setEditingId(null);
    setAccionForm(emptyAccionForm);
  };

  const editAccion = (accion: ReporteAccion) => {
    setEditingId(accion.id);
    setAccionForm({
      tipoAccion: accion.tipoAccion,
      descripcionAccion: accion.descripcionAccion,
      fechaImplementacion: accion.fechaImplementacion,
      responsableImplementacion: accion.responsableImplementacion,
      resultadoEsperado: accion.resultadoEsperado,
      evidenciaRequerida: accion.evidenciaRequerida,
      observaciones: accion.observaciones,
    });
    setAccionError("");
  };

  const deleteAccion = (accionId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta acción?")) return;

    setReporte((current) => ({
      ...current,
      acciones: current.acciones
        .filter((accion) => accion.id !== accionId)
        .map((accion, index) => ({
          ...accion,
          numero: index + 1,
        })),
    }));

    if (editingId === accionId) {
      setEditingId(null);
      setAccionForm(emptyAccionForm);
    }
  };

  const updateCierreAccion = (
    accionId: string,
    fields: Partial<Pick<ReporteAccion, "cierre" | "fechaCierre" | "observacion" | "evidencia" | "estadoIndividual">>,
  ) => {
    setReporte((current) => ({
      ...current,
      acciones: current.acciones.map((accion) => (accion.id === accionId ? { ...accion, ...fields } : accion)),
    }));
  };

  const validateReporte = () => {
    if (!reporte.proceso) return "Falta diligenciar el campo: Proceso.";
    if (!reporte.fechaHallazgo) return "Falta diligenciar el campo: Fecha del hallazgo.";
    if (!reporte.tipoHallazgo) return "Falta diligenciar el campo: Tipo de hallazgo.";
    if (!reporte.fuente || reporte.fuente === "Seleccione una opción") return "Falta diligenciar el campo: Fuente.";
    if (!reporte.descripcionHallazgo.trim()) return "Falta diligenciar el campo: Descripción del hallazgo.";
    if (!reporte.descripcionProblema.trim()) return "Falta diligenciar el campo: Descripción del problema.";
    if (!reporte.metodologiaAnalisis.trim()) return "Falta diligenciar el campo: Metodología utilizada.";
    if (!reporte.causasIdentificadas.trim()) return "Falta diligenciar el campo: Causas identificadas.";
    if (!reporte.causaRaiz.trim()) return "Falta diligenciar el campo: Causa raíz.";
    if (!reporte.causas.trim()) return "Falta diligenciar el campo: Causas.";
    if (!reporte.consecuencias.trim()) return "Falta diligenciar el campo: Consecuencias.";
    if (!reporte.riesgosOportunidades.trim()) return "Falta diligenciar el campo: Riesgos y oportunidades.";
    if (reporte.acciones.length === 0) return "Falta agregar al menos una acción.";

    return "";
  };

  const validateIdentificacion = () => {
    if (!reporte.proceso) return "Falta diligenciar el campo: Proceso.";
    if (!reporte.fechaHallazgo) return "Falta diligenciar el campo: Fecha del hallazgo.";
    if (!reporte.tipoHallazgo) return "Falta diligenciar el campo: Tipo de hallazgo.";
    if (!reporte.fuente || reporte.fuente === "Seleccione una opción") return "Falta diligenciar el campo: Fuente.";
    if (!reporte.descripcionHallazgo.trim()) return "Falta diligenciar el campo: Descripción del hallazgo.";

    return "";
  };

  const validateAnalisis = () => {
    if (!reporte.descripcionProblema.trim()) return "Falta diligenciar el campo: Descripción del problema.";
    if (!reporte.metodologiaAnalisis.trim()) return "Falta diligenciar el campo: Metodología utilizada.";
    if (!reporte.causasIdentificadas.trim()) return "Falta diligenciar el campo: Causas identificadas.";
    if (!reporte.causaRaiz.trim()) return "Falta diligenciar el campo: Causa raíz.";
    if (!reporte.causas.trim()) return "Falta diligenciar el campo: Causas.";
    if (!reporte.consecuencias.trim()) return "Falta diligenciar el campo: Consecuencias.";
    if (!reporte.riesgosOportunidades.trim()) return "Falta diligenciar el campo: Riesgos y oportunidades.";

    return "";
  };

  const goNextStep = () => {
    const error = currentStep === 0 ? validateIdentificacion() : currentStep === 1 ? validateAnalisis() : "";
    if (error) {
      setFormError(error);
      return;
    }

    setFormError("");
    setCurrentStep((step) => Math.min(step + 1, fasesReporte.length - 1));
  };

  const goBackStep = () => {
    setFormError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const saveReporte = () => {
    const error = validateReporte();
    if (error) {
      setFormError(error);
      return;
    }

    setFormError("");
    const reporteEnviado: ReporteAccionesData = {
      ...reporte,
      codigo: codigoFormato,
      version: versionFormato,
      usuarioCreador: usuarioActual?.nombre ?? "Usuario ROCA",
      estado: "En revisión de Calidad",
      aprobadorActual: "Gestión de Calidad",
    };
    setReporte(reporteEnviado);
    console.log(`JSON Reporte de Acciones ${reporteEnviado.codigo}`, [reporteEnviado]);
    onSave?.(reporteEnviado);
  };

  const aplicarFlujo = (accion: ReporteAccionFlujo) => {
    setFormError("");

    if (accion === "solicitar-correccion") {
      if (!reporte.observacionesCalidad.trim()) {
        setFormError("Registra las observaciones de Calidad antes de solicitar corrección.");
        return;
      }

      setReporte((current) => ({
        ...current,
        estado: "Devuelto para corrección",
        aprobadorActual: current.proceso || "Líder de proceso",
      }));
      return;
    }

    if (accion === "reenviar-calidad") {
      setReporte((current) => ({
        ...current,
        estado: "En revisión de Calidad",
        aprobadorActual: "Gestión de Calidad",
      }));
      return;
    }

    if (accion === "aprobar-definir-seguimiento") {
      if (!reporte.fechaSeguimientoEficacia) {
        setFormError("Calidad debe definir la fecha de seguimiento de eficacia antes de aprobar.");
        return;
      }

      if (!reporte.observacionesCalidad.trim()) {
        setFormError("Falta diligenciar el campo: Observaciones de Calidad.");
        return;
      }

      if (!reporte.responsableValidarEficacia.trim()) {
        setFormError("Falta diligenciar el campo: Responsable de validar eficacia.");
        return;
      }

      setReporte((current) => ({
        ...current,
        estado: "Aprobado por Calidad",
        aprobadorActual: "Gestión de Calidad",
      }));
      return;
    }

    if (accion === "remitir-lider") {
      setReporte((current) => ({
        ...current,
        estado: "En implementación",
        aprobadorActual: current.proceso || "Líder de proceso",
      }));
      return;
    }

    if (accion === "enviar-cierre-calidad") {
      const accionesPendientes = reporte.acciones.some((item) => item.cierre !== "Cerrado" || !item.fechaCierre || !item.evidencia);
      if (accionesPendientes) {
        setFormError("Para enviar a Calidad, todas las acciones deben estar cerradas, con fecha de cierre y evidencia.");
        return;
      }

      setReporte((current) => ({
        ...current,
        estado: "En validación de eficacia",
        aprobadorActual: "Gestión de Calidad",
      }));
      return;
    }

    if (accion === "cerrar-formato") {
      setReporte((current) => ({
        ...current,
        estado: "Cerrado",
        aprobadorActual: "Gestión de Calidad",
      }));
      console.log(`JSON Reporte de Acciones ${reporte.codigo} - cerrado`, [{ ...reporte, estado: "Cerrado", aprobadorActual: "Gestión de Calidad" }]);
    }
  };

  const renderSeguimientoActions = () => {
    if (reporte.estado === "Borrador") {
      return null;
    }

    if (reporte.estado === "En revisión de Calidad") {
      return (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => aplicarFlujo("solicitar-correccion")}
            className="inline-flex h-11 items-center justify-center rounded-md border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-700 transition hover:bg-red-100"
          >
            Solicitar corrección
          </button>
          <button
            type="button"
            onClick={() => aplicarFlujo("aprobar-definir-seguimiento")}
            className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Aprobar y definir seguimiento
          </button>
        </div>
      );
    }

    if (reporte.estado === "Devuelto para corrección") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("reenviar-calidad")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Reenviar a Calidad
        </button>
      );
    }

    if (reporte.estado === "Aprobado por Calidad") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("remitir-lider")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Remitir al líder
        </button>
      );
    }

    if (reporte.estado === "En implementación" || reporte.estado === "Pendiente de cierre por líder") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("enviar-cierre-calidad")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Enviar cierre a Calidad
        </button>
      );
    }

    if (reporte.estado === "En validación de eficacia") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("cerrar-formato")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Validar eficacia y cerrar formato
        </button>
      );
    }

    return <p className="text-sm font-semibold text-emerald-700">El formato ya fue cerrado por Calidad.</p>;
  };

  return (
    <div className="min-w-0 space-y-5">
      <PhaseStepper activeStep={currentStep} />

      {currentStep === 0 ? (
        <SectionWrapper>
          <div className="grid min-w-0 gap-x-5 gap-y-4 lg:grid-cols-2">
            <DynamicSelect
              id="proceso"
              label="Proceso"
              icon={<Hash className="size-5 text-blue-600" />}
              value={reporte.proceso}
              options={["", ...procesos]}
              onChange={(value) => updateReporte("proceso", value)}
            />

            <Field id="fechaHallazgo" label="Fecha de hallazgo" icon={<CalendarDays className="size-5 text-rose-600" />}>
              <input
                id="fechaHallazgo"
                type="date"
                value={reporte.fechaHallazgo}
                onChange={(event) => updateReporte("fechaHallazgo", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <DynamicSelect
              id="tipoHallazgo"
              label="Tipo de hallazgo"
              icon={<ClipboardList className="size-5 text-fuchsia-600" />}
              value={reporte.tipoHallazgo}
              options={tiposHallazgo}
              onChange={handleTipoHallazgoChange}
            />

            <DynamicSelect
              id="fuente"
              label="Fuente"
              icon={<Search className="size-5 text-orange-600" />}
              value={reporte.fuente}
              options={fuentes}
              onChange={(value) => updateReporte("fuente", value)}
            />

            <div className="lg:col-span-2">
              <Field id="descripcionHallazgo" label="Descripción del hallazgo" icon={<FileText className="size-5 text-rose-600" />}>
                <textarea
                  id="descripcionHallazgo"
                  value={reporte.descripcionHallazgo}
                  onChange={(event) => updateReporte("descripcionHallazgo", event.target.value)}
                  placeholder="Descripción clara del hallazgo identificado"
                  className={textareaClassName}
                />
              </Field>
            </div>

            <Field id="usuarioCreador" label="Usuario creador" icon={<UserRound className="size-5 text-sky-700" />}>
              <input
                id="usuarioCreador"
                value={usuarioActual?.nombre ?? "Usuario ROCA"}
                readOnly
                className={`${inputClassName} bg-slate-100 text-slate-500`}
              />
            </Field>
          </div>
        </SectionWrapper>
      ) : null}

      {currentStep === 1 ? (
        <SectionWrapper>
          <div className="grid min-w-0 gap-x-5 gap-y-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Field id="descripcionProblema" label="Descripción del problema" icon={<FileText className="size-5 text-fuchsia-600" />}>
                <textarea
                  id="descripcionProblema"
                  value={reporte.descripcionProblema}
                  onChange={(event) => updateReporte("descripcionProblema", event.target.value)}
                  placeholder="Describa el problema que origina el reporte"
                  className={textareaClassName}
                />
              </Field>
            </div>

            <Field id="metodologiaAnalisis" label="Metodología utilizada" icon={<ListChecks className="size-5 text-blue-600" />}>
              <textarea
                id="metodologiaAnalisis"
                value={reporte.metodologiaAnalisis}
                onChange={(event) => updateReporte("metodologiaAnalisis", event.target.value)}
                placeholder="Ejemplo: 5 porqués, Ishikawa, lluvia de ideas, análisis documental"
                className={textareaClassName}
              />
            </Field>

            <Field id="causasIdentificadas" label="Causas identificadas" icon={<Hash className="size-5 text-emerald-600" />}>
              <textarea
                id="causasIdentificadas"
                value={reporte.causasIdentificadas}
                onChange={(event) => updateReporte("causasIdentificadas", event.target.value)}
                placeholder="Liste las causas identificadas durante el análisis"
                className={textareaClassName}
              />
            </Field>

            <Field id="causaRaiz" label="Causa raíz" icon={<Hash className="size-5 text-rose-600" />}>
              <textarea
                id="causaRaiz"
                value={reporte.causaRaiz}
                onChange={(event) => updateReporte("causaRaiz", event.target.value)}
                placeholder="Causa raíz confirmada"
                className={textareaClassName}
              />
            </Field>

            <Field id="causas" label="Causas" icon={<Hash className="size-5 text-blue-600" />}>
              <textarea
                id="causas"
                value={reporte.causas}
                onChange={(event) => updateReporte("causas", event.target.value)}
                placeholder="Causa raíz o causas identificadas"
                className={textareaClassName}
              />
            </Field>

            <Field id="consecuencias" label="Consecuencias" icon={<FileText className="size-5 text-orange-600" />}>
              <textarea
                id="consecuencias"
                value={reporte.consecuencias}
                onChange={(event) => updateReporte("consecuencias", event.target.value)}
                placeholder="Consecuencias del hallazgo"
                className={textareaClassName}
              />
            </Field>

            <Field id="riesgosOportunidades" label="Riesgos y oportunidades" icon={<ListChecks className="size-5 text-emerald-600" />}>
              <textarea
                id="riesgosOportunidades"
                value={reporte.riesgosOportunidades}
                onChange={(event) => updateReporte("riesgosOportunidades", event.target.value)}
                placeholder="Riesgos u oportunidades asociados"
                className={textareaClassName}
              />
            </Field>

            <div className="lg:col-span-2">
              <Field id="observacionesAnalisis" label="Observaciones" icon={<FileText className="size-5 text-rose-600" />}>
                <textarea
                  id="observacionesAnalisis"
                  value={reporte.observacionesAnalisis}
                  onChange={(event) => updateReporte("observacionesAnalisis", event.target.value)}
                  placeholder="Observaciones adicionales del análisis de causa"
                  className={textareaClassName}
                />
              </Field>
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      {currentStep === 2 ? (
        <>
          <SectionWrapper>
            <div className="space-y-6">
              <AccionForm value={accionForm} isEditing={editingId !== null} error={accionError} onChange={setAccionForm} onSubmit={saveAccion} />
              <AccionesTable
                acciones={reporte.acciones}
                canCloseActions={reporte.estado === "En implementación" || reporte.estado === "Pendiente de cierre por líder"}
                onEdit={editAccion}
                onDelete={deleteAccion}
                onUpdateCierre={updateCierreAccion}
              />
            </div>
          </SectionWrapper>

          {reporte.estado !== "Borrador" && esCalidad ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Seguimiento de Calidad</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{reporte.estado}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Responsable actual: {reporte.aprobadorActual}</p>
                </div>

                <div className="w-full space-y-4 lg:max-w-2xl">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="fechaSeguimientoEficacia" label="Fecha seguimiento eficacia" icon={<CalendarDays className="size-5 text-rose-600" />}>
                      <input
                        id="fechaSeguimientoEficacia"
                        type="date"
                        value={reporte.fechaSeguimientoEficacia}
                        onChange={(event) => updateReporte("fechaSeguimientoEficacia", event.target.value)}
                        className={inputClassName}
                      />
                    </Field>

                    <Field id="observacionesCalidad" label="Observaciones de Calidad" icon={<FileText className="size-5 text-fuchsia-600" />}>
                      <textarea
                        id="observacionesCalidad"
                        value={reporte.observacionesCalidad}
                        onChange={(event) => updateReporte("observacionesCalidad", event.target.value)}
                        placeholder="Observaciones, seguimiento o motivo de devolución"
                        className="min-h-12 w-full resize-y rounded-md border border-[#cbd6e4] bg-white px-3 py-3 text-sm font-semibold text-[#071127] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </Field>

                    <Field id="responsableValidarEficacia" label="Responsable de validar eficacia" icon={<UserRound className="size-5 text-sky-700" />}>
                      <input
                        id="responsableValidarEficacia"
                        value={reporte.responsableValidarEficacia}
                        onChange={(event) => updateReporte("responsableValidarEficacia", event.target.value)}
                        placeholder="Nombre del responsable"
                        className={inputClassName}
                      />
                    </Field>
                  </div>

                  <div className="flex justify-end">{renderSeguimientoActions()}</div>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {formError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900 shadow-sm">{formError}</div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={goBackStep}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd6e4] bg-white px-7 text-sm font-black text-[#34435e] shadow-sm transition hover:border-blue-500 hover:text-blue-700"
          >
            Atrás
          </button>
        ) : (
          <span />
        )}

        {currentStep < 2 ? (
          <button
            type="button"
            onClick={goNextStep}
            className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={saveReporte}
            className="inline-flex h-11 items-center justify-center gap-3 rounded-md bg-blue-600 px-8 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Save className="size-5" />
            Guardar Reporte
          </button>
        )}
      </div>
    </div>
  );
}
