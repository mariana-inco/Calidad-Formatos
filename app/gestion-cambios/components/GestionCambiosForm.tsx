"use client";

import { useState } from "react";
import { Building2, ClipboardList, FilePenLine, FileText, GitBranch, Leaf, Pencil, ShieldAlert, Trash2, TriangleAlert, Users, Wrench } from "lucide-react";
import { ButtonAdd } from "./ButtonAdd";
import { CustomInput } from "./CustomInput";
import { SectionWrapper } from "./SectionWrapper";
import {
  analisisFields,
  planFields,
  procesoOptions,
  solicitudFields,
  tipoCambioField,
  tipoCambioOptions,
} from "./formData";
import type { PlanActividad, SolicitudCambioData, UsuarioGestionCambio } from "./types";
import { roleLabels } from "./workflow";

type SolicitudCambioFormProps = {
  formId?: string;
  empresaActiva: SolicitudCambioData["empresa"];
  initialData?: SolicitudCambioData;
  responsablesAprobacion?: UsuarioGestionCambio[];
  onSubmit?: (data: SolicitudCambioData) => void;
};

const emptyPlanForm = {
  actividades: "",
  responsable: "",
  fecha: "",
};

const analisisIcons: Record<string, React.ReactNode> = {
  documentos: <FileText className="size-3.5" />,
  procesos: <GitBranch className="size-3.5" />,
  personas: <Users className="size-3.5" />,
  instalaciones: <Building2 className="size-3.5" />,
  "tecnologia-maquinaria": <Wrench className="size-3.5" />,
  "riesgos-organizacionales": <TriangleAlert className="size-3.5" />,
  "peligros-riesgos": <ShieldAlert className="size-3.5" />,
  "aspectos-impactos-ambientales": <Leaf className="size-3.5" />,
};

export function SolicitudCambioForm({ formId, empresaActiva, initialData, responsablesAprobacion = [], onSubmit }: SolicitudCambioFormProps) {
  const [solicitudValues, setSolicitudValues] = useState<Record<string, string>>(() => ({
    proceso: initialData?.proceso ?? "",
  }));
  const [analisisValues, setAnalisisValues] = useState<Record<string, string>>(() => ({ ...(initialData?.analisis ?? {}) }));
  const [tipoCambioSeleccionado, setTipoCambioSeleccionado] = useState("");
  const [cualTipoCambio, setCualTipoCambio] = useState("");
  const [tiposCambio, setTiposCambio] = useState<string[]>(() => initialData?.tiposCambio ?? []);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [planRows, setPlanRows] = useState<PlanActividad[]>(() => initialData?.plan ?? []);
  const [aprobadorSeleccionadoId, setAprobadorSeleccionadoId] = useState(initialData?.aprobadorSeleccionadoId ?? responsablesAprobacion[0]?.id ?? "");
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const isTipoCambioOtros = tipoCambioSeleccionado === "OTROS";

  const updateSolicitudValue = (fieldId: string, value: string) => {
    setSolicitudValues((current) => ({ ...current, [fieldId]: value }));
  };

  const updateAnalisisValue = (fieldId: string, value: string) => {
    setAnalisisValues((current) => ({ ...current, [fieldId]: value }));
  };

  const agregarTipoCambio = () => {
    if (!tipoCambioSeleccionado) return;

    const tipoCambio = isTipoCambioOtros && cualTipoCambio.trim() ? `OTROS - ${cualTipoCambio.trim()}` : tipoCambioSeleccionado;
    if (tiposCambio.includes(tipoCambio)) return;

    setTiposCambio((items) => [...items, tipoCambio]);
    setTipoCambioSeleccionado("");
    setCualTipoCambio("");
  };

  const editarTipoCambio = (tipoCambio: string) => {
    if (tipoCambio.startsWith("OTROS - ")) {
      setTipoCambioSeleccionado("OTROS");
      setCualTipoCambio(tipoCambio.replace("OTROS - ", ""));
    } else {
      setTipoCambioSeleccionado(tipoCambio);
      setCualTipoCambio("");
    }

    setTiposCambio((items) => items.filter((item) => item !== tipoCambio));
  };

  const eliminarTipoCambio = (tipoCambio: string) => setTiposCambio((items) => items.filter((item) => item !== tipoCambio));

  const actualizarPlanForm = (fieldId: string, value: string) => {
    if (fieldId === "actividades" || fieldId === "responsable" || fieldId === "fecha") {
      setPlanForm((form) => ({ ...form, [fieldId]: value }));
    }
  };

  const agregarPlan = () => {
    if (!planForm.actividades && !planForm.responsable && !planForm.fecha) return;

    if (editingPlanId !== null) {
      setPlanRows((rows) => rows.map((row) => (row.id === editingPlanId ? { id: row.id, ...planForm } : row)));
      setEditingPlanId(null);
    } else {
      setPlanRows((rows) => [...rows, { id: Date.now(), ...planForm }]);
    }

    setPlanForm(emptyPlanForm);
  };

  const editarPlan = (plan: PlanActividad) => {
    setPlanForm({
      actividades: plan.actividades,
      responsable: plan.responsable,
      fecha: plan.fecha,
    });
    setEditingPlanId(plan.id);
  };

  const eliminarPlan = (planId: number) => {
    setPlanRows((rows) => rows.filter((row) => row.id !== planId));
    if (editingPlanId === planId) {
      setEditingPlanId(null);
      setPlanForm(emptyPlanForm);
    }
  };

  const getPendingTipoCambio = () => {
    if (!tipoCambioSeleccionado) return "";
    return isTipoCambioOtros && cualTipoCambio.trim() ? `OTROS - ${cualTipoCambio.trim()}` : tipoCambioSeleccionado;
  };

  const submitSolicitud = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const pendingTipoCambio = getPendingTipoCambio();
    const finalTiposCambio = pendingTipoCambio && !tiposCambio.includes(pendingTipoCambio) ? [...tiposCambio, pendingTipoCambio] : tiposCambio;
    const analisis = Object.fromEntries(analisisFields.map((field) => [field.id, analisisValues[field.id] ?? ""]));

    onSubmit?.({
      empresa: empresaActiva,
      liderProceso: initialData?.liderProceso,
      liderProcesoId: initialData?.liderProcesoId,
      proceso: solicitudValues.proceso ?? "",
      tiposCambio: finalTiposCambio,
      analisis,
      plan: planRows,
      aprobadorSeleccionadoId,
    });
  };

  return (
    <form id={formId} onSubmit={submitSolicitud} className="space-y-9 text-slate-950">
        <SectionWrapper title="1. SOLICITUD DEL CAMBIO" icon={<FilePenLine className="size-5" />}>
          <div className="space-y-7">
            <div className="grid items-start gap-6 md:grid-cols-[0.9fr_1.05fr_1.15fr]">
              {solicitudFields.map((field) => (
                <CustomInput
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  options={field.id === "proceso" ? procesoOptions : undefined}
                  value={solicitudValues[field.id] ?? ""}
                  onChange={(value) => updateSolicitudValue(field.id, value)}
                />
              ))}

              <CustomInput
                id={tipoCambioField.id}
                label={tipoCambioField.label}
                type={tipoCambioField.type}
                placeholder={tipoCambioField.placeholder}
                options={tipoCambioOptions}
                value={tipoCambioSeleccionado}
                onChange={(value) => {
                  setTipoCambioSeleccionado(value);
                  if (value !== "OTROS") {
                    setCualTipoCambio("");
                  }
                }}
              />
            </div>

            {isTipoCambioOtros ? (
              <CustomInput
                id="cual-tipo-cambio"
                label="¿Cual?"
                type="text"
                placeholder="Describa el tipo de cambio"
                value={cualTipoCambio}
                onChange={setCualTipoCambio}
              />
            ) : null}

            <div className="flex justify-center">
              <ButtonAdd label="Añadir Tipo de Cambio" onClick={agregarTipoCambio} variant="text" />
            </div>

            {tiposCambio.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="grid grid-cols-[1fr_5rem] bg-emerald-900 text-xs font-bold italic uppercase text-white">
                  <div className="px-4 py-2 text-center">TIPO DE CAMBIO</div>
                  <div className="border-l border-emerald-800 px-3 py-2 text-center">ACCIÓN</div>
                </div>
                {tiposCambio.map((tipoCambio) => (
                  <div key={tipoCambio} className="grid grid-cols-[1fr_5rem] items-center border-t border-slate-200 text-sm text-slate-950 even:bg-slate-50">
                    <div className="px-4 py-2 text-center">{tipoCambio}</div>
                    <div className="flex items-center justify-center gap-2 border-l border-slate-200 px-3 py-2">
                      <button
                        type="button"
                        aria-label="Editar tipo de cambio"
                        onClick={() => editarTipoCambio(tipoCambio)}
                        className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar tipo de cambio"
                        onClick={() => eliminarTipoCambio(tipoCambio)}
                        className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <label className="block">
                <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Enviar para aprobación a</span>
                <select
                  value={aprobadorSeleccionadoId}
                  onChange={(event) => setAprobadorSeleccionadoId(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione responsable configurado</option>
                  {responsablesAprobacion.map((responsable) => (
                    <option key={responsable.id} value={responsable.id}>
                      {responsable.nombre} - {roleLabels[responsable.rol]}
                      {responsable.proceso ? ` - ${responsable.proceso}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs font-semibold leading-5 text-blue-900">
                Calidad revisa primero la documentación y, si está completa, remite el registro al responsable seleccionado.
              </p>
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper title="2. ANÁLISIS ASOCIADOS AL CAMBIO" icon={<ClipboardList className="size-5" />}>
          <div className="grid gap-x-9 gap-y-8 md:grid-cols-2">
            {analisisFields.map((field) => (
              <CustomInput
                key={field.id}
                id={field.id}
                label={field.label}
                type={field.type}
                placeholder={field.placeholder}
                icon={analisisIcons[field.id]}
                value={analisisValues[field.id] ?? ""}
                onChange={(value) => updateAnalisisValue(field.id, value)}
              />
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper title="3. PLAN PARA IMPLEMENTACIÓN DEL CAMBIO">
          <div className="space-y-8">
            <div className="flex flex-col items-center justify-center gap-3 text-center lg:flex-row">
              <p className="text-sm font-bold italic text-slate-950">
                Escriba las actividades necesarias para la implementación del cambio propuesto, incluidas las actividades para control de riesgos SST y de impactos ambientales, luego oprima el botón
              </p>
            </div>

            <div className="grid items-end gap-6 lg:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.48fr)_11.5rem]">
              {planFields.map((field) => (
                <CustomInput
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={planForm[field.id]}
                  onChange={(value) => actualizarPlanForm(field.id, value)}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <ButtonAdd label={editingPlanId === null ? "Añadir Actividad" : "Actualizar Actividad"} onClick={agregarPlan} variant="text" />
            </div>

            {planRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="grid grid-cols-[1.4fr_1fr_9rem_5rem] bg-emerald-900 text-xs font-bold italic uppercase text-white">
                  <div className="px-4 py-2 text-center">ACTIVIDADES</div>
                  <div className="border-l border-emerald-800 px-4 py-2 text-center">RESPONSABLE</div>
                  <div className="border-l border-emerald-800 px-4 py-2 text-center">FECHA</div>
                  <div className="border-l border-emerald-800 px-3 py-2 text-center">ACCIÓN</div>
                </div>
                {planRows.map((plan) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-[1.4fr_1fr_9rem_5rem] items-center border-t border-slate-200 text-sm text-slate-950 even:bg-slate-50"
                  >
                    <div className="px-4 py-2 text-center">{plan.actividades}</div>
                    <div className="border-l border-slate-200 px-4 py-2 text-center">{plan.responsable}</div>
                    <div className="border-l border-slate-200 px-4 py-2 text-center">{plan.fecha}</div>
                    <div className="flex items-center justify-center gap-2 border-l border-slate-200 px-3 py-2">
                      <button
                        type="button"
                        aria-label="Editar fila del plan"
                        onClick={() => editarPlan(plan)}
                        className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar fila del plan"
                        onClick={() => eliminarPlan(plan.id)}
                        className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </SectionWrapper>
    </form>
  );
}

export const GestionCambiosForm = SolicitudCambioForm;
