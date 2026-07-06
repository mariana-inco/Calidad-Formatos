"use client";

import { Save } from "lucide-react";
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
    causas: "",
    consecuencias: "",
    riesgosOportunidades: "",
    estado: "Borrador",
    aprobadorActual: "Líder de proceso",
    fechaSeguimientoEficacia: "",
    observacionesCalidad: "",
    acciones: [],
  };
}

const fasesReporte = ["Identificación del Hallazgo", "Análisis de Causa", "Implementación"] as const;

function PhaseStepper({ activeStep }: { activeStep: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {fasesReporte.map((fase, index) => {
          const isActive = index <= activeStep;

          return (
            <div key={fase} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-black transition ${
                  isActive ? "bg-emerald-800 text-white shadow-sm" : "bg-slate-100 text-slate-400"
                }`}
              >
                {index + 1}
              </div>
              <p className={`truncate text-sm font-black ${isActive ? "text-emerald-900" : "text-slate-400"}`}>{fase}</p>
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
      !accionForm.responsableImplementacion.trim()
    ) {
      return "Por favor completa los campos de implementación antes de agregar la acción.";
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

  const updateCierreAccion = (accionId: string, fields: Partial<Pick<ReporteAccion, "cierre" | "fechaCierre" | "observacion" | "evidencia">>) => {
    setReporte((current) => ({
      ...current,
      acciones: current.acciones.map((accion) => (accion.id === accionId ? { ...accion, ...fields } : accion)),
    }));
  };

  const validateReporte = () => {
    if (!reporte.proceso) return "Selecciona el proceso para continuar.";
    if (!reporte.fechaHallazgo) return "Selecciona la fecha de hallazgo.";
    if (!reporte.tipoHallazgo) return "Selecciona el tipo de hallazgo.";
    if (!reporte.fuente || reporte.fuente === "Seleccione una opción") return "Selecciona una fuente relacionada con el tipo de hallazgo.";
    if (!reporte.descripcionHallazgo.trim()) return "Completa la descripción del hallazgo para continuar.";
    if (!reporte.causas.trim()) return "Registra las causas del hallazgo.";
    if (!reporte.consecuencias.trim()) return "Registra las consecuencias del hallazgo.";
    if (!reporte.riesgosOportunidades.trim()) return "Registra los riesgos y oportunidades asociados.";
    if (reporte.acciones.length === 0) return "Debes agregar al menos una acción antes de guardar el reporte.";

    return "";
  };

  const validateIdentificacion = () => {
    if (!reporte.proceso) return "Selecciona el proceso para continuar.";
    if (!reporte.fechaHallazgo) return "Selecciona la fecha de hallazgo.";
    if (!reporte.tipoHallazgo) return "Selecciona el tipo de hallazgo.";
    if (!reporte.fuente || reporte.fuente === "Seleccione una opción") return "Selecciona una fuente relacionada con el tipo de hallazgo.";
    if (!reporte.descripcionHallazgo.trim()) return "Completa la descripción del hallazgo para continuar.";

    return "";
  };

  const validateAnalisis = () => {
    if (!reporte.causas.trim()) return "Registra las causas del hallazgo.";
    if (!reporte.consecuencias.trim()) return "Registra las consecuencias del hallazgo.";
    if (!reporte.riesgosOportunidades.trim()) return "Registra los riesgos y oportunidades asociados.";

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
        estado: "Requiere corrección",
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
        setFormError("Registra en observaciones la definición del seguimiento antes de aprobar.");
        return;
      }

      setReporte((current) => ({
        ...current,
        estado: "Aprobada por Calidad",
        aprobadorActual: "Gestión de Calidad",
      }));
      return;
    }

    if (accion === "remitir-lider") {
      setReporte((current) => ({
        ...current,
        estado: "En cierre por líder",
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
        estado: "Cierre enviado a Calidad",
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
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900"
          >
            Aprobar y definir seguimiento
          </button>
        </div>
      );
    }

    if (reporte.estado === "Requiere corrección") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("reenviar-calidad")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900"
        >
          Reenviar a Calidad
        </button>
      );
    }

    if (reporte.estado === "Aprobada por Calidad") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("remitir-lider")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900"
        >
          Remitir al líder
        </button>
      );
    }

    if (reporte.estado === "En cierre por líder") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("enviar-cierre-calidad")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900"
        >
          Enviar cierre a Calidad
        </button>
      );
    }

    if (reporte.estado === "Cierre enviado a Calidad") {
      return (
        <button
          type="button"
          onClick={() => aplicarFlujo("cerrar-formato")}
          className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900"
        >
          Validar eficacia y cerrar formato
        </button>
      );
    }

    return <p className="text-sm font-semibold text-emerald-700">El formato ya fue cerrado por Calidad.</p>;
  };

  return (
    <div className="space-y-7">
      <PhaseStepper activeStep={currentStep} />

      {currentStep === 0 ? (
        <SectionWrapper>
          <div className="grid gap-5 lg:grid-cols-2">
            <DynamicSelect id="proceso" label="Proceso" value={reporte.proceso} options={["", ...procesos]} onChange={(value) => updateReporte("proceso", value)} />

            <Field id="fechaHallazgo" label="Fecha de hallazgo">
              <input
                id="fechaHallazgo"
                type="date"
                value={reporte.fechaHallazgo}
                onChange={(event) => updateReporte("fechaHallazgo", event.target.value)}
                className={inputClassName}
              />
            </Field>

            <DynamicSelect id="tipoHallazgo" label="Tipo de hallazgo" value={reporte.tipoHallazgo} options={tiposHallazgo} onChange={handleTipoHallazgoChange} />

            <DynamicSelect id="fuente" label="Fuente" value={reporte.fuente} options={fuentes} onChange={(value) => updateReporte("fuente", value)} />

            <div className="lg:col-span-2">
              <Field id="descripcionHallazgo" label="Descripción del hallazgo">
                <textarea
                  id="descripcionHallazgo"
                  value={reporte.descripcionHallazgo}
                  onChange={(event) => updateReporte("descripcionHallazgo", event.target.value)}
                  placeholder="Descripción clara del hallazgo identificado"
                  className={textareaClassName}
                />
              </Field>
            </div>
          </div>
        </SectionWrapper>
      ) : null}

      {currentStep === 1 ? (
        <SectionWrapper>
          <div className="grid gap-5 lg:grid-cols-3">
            <Field id="causas" label="Causas">
              <textarea
                id="causas"
                value={reporte.causas}
                onChange={(event) => updateReporte("causas", event.target.value)}
                placeholder="Causa raíz o causas identificadas"
                className={textareaClassName}
              />
            </Field>

            <Field id="consecuencias" label="Consecuencias">
              <textarea
                id="consecuencias"
                value={reporte.consecuencias}
                onChange={(event) => updateReporte("consecuencias", event.target.value)}
                placeholder="Consecuencias del hallazgo"
                className={textareaClassName}
              />
            </Field>

            <Field id="riesgosOportunidades" label="Riesgos y oportunidades">
              <textarea
                id="riesgosOportunidades"
                value={reporte.riesgosOportunidades}
                onChange={(event) => updateReporte("riesgosOportunidades", event.target.value)}
                placeholder="Riesgos u oportunidades asociados"
                className={textareaClassName}
              />
            </Field>
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
                canCloseActions={reporte.estado === "En cierre por líder"}
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
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Seguimiento de Calidad</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">{reporte.estado}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Responsable actual: {reporte.aprobadorActual}</p>
                </div>

                <div className="w-full space-y-4 lg:max-w-2xl">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="fechaSeguimientoEficacia" label="Fecha seguimiento eficacia">
                      <input
                        id="fechaSeguimientoEficacia"
                        type="date"
                        value={reporte.fechaSeguimientoEficacia}
                        onChange={(event) => updateReporte("fechaSeguimientoEficacia", event.target.value)}
                        className={inputClassName}
                      />
                    </Field>

                    <Field id="observacionesCalidad" label="Observaciones de Calidad">
                      <textarea
                        id="observacionesCalidad"
                        value={reporte.observacionesCalidad}
                        onChange={(event) => updateReporte("observacionesCalidad", event.target.value)}
                        placeholder="Observaciones, seguimiento o motivo de devolución"
                        className="min-h-12 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100"
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={goBackStep}
            className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-7 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-700 hover:text-emerald-800"
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
            className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-800 px-8 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={saveReporte}
            className="inline-flex h-12 items-center justify-center gap-3 rounded-md bg-emerald-800 px-8 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <Save className="size-5" />
            Guardar Reporte
          </button>
        )}
      </div>
    </div>
  );
}
