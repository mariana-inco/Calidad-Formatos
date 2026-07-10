"use client";

import { useMemo, useState } from "react";
import { Building2, ChevronDown, ClipboardList, FilePenLine, FileText, GitBranch, Info, Leaf, Pencil, Search, ShieldAlert, Trash2, TriangleAlert, Users, Wrench, X } from "lucide-react";
import { ButtonAdd } from "./ButtonAdd";
import { CustomInput } from "./CustomInput";
import { SectionWrapper } from "./SectionWrapper";
import {
  analisisFields,
  analisisGuideQuestions,
  planFields,
  procesoOptions,
  solicitudFields,
  tipoCambioField,
  tipoCambioOptions,
} from "./formData";
import type { PlanActividad, SolicitudCambioData, UsuarioGestionCambio } from "./types";

type SolicitudCambioFormProps = {
  formId?: string;
  empresaActiva: SolicitudCambioData["empresa"];
  usuarioActual?: UsuarioGestionCambio;
  lideresProceso: UsuarioGestionCambio[];
  usuariosResponsables: UsuarioGestionCambio[];
  initialData?: SolicitudCambioData;
  onSubmit?: (data: SolicitudCambioData, intent: "draft" | "send-quality") => void;
};

const emptyPlanForm = {
  actividades: "",
  responsableId: "",
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

function splitOtherValue(value?: string) {
  if (!value?.startsWith("OTRO - ") && !value?.startsWith("OTROS - ")) return { option: value ?? "", detail: "" };
  const [option, ...detailParts] = value.split(" - ");
  return { option, detail: detailParts.join(" - ") };
}

export function SolicitudCambioForm({ formId, empresaActiva, usuarioActual, lideresProceso, usuariosResponsables, initialData, onSubmit }: SolicitudCambioFormProps) {
  const initialLeaderId = usuarioActual?.rol === "LIDER_PROCESO" && initialData?.liderProcesoId === usuarioActual.id ? "" : initialData?.liderProcesoId ?? "";
  const [solicitudValues, setSolicitudValues] = useState<Record<string, string>>(() => ({
    proceso: initialData?.proceso ?? "",
  }));
  const [analisisValues, setAnalisisValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initialData?.analisis ?? {}).map(([key, value]) => [key, splitOtherValue(value).detail || value])),
  );
  const [tipoCambioSeleccionado, setTipoCambioSeleccionado] = useState("");
  const [liderProcesoId, setLiderProcesoId] = useState(initialLeaderId);
  const [cualTipoCambio, setCualTipoCambio] = useState("");
  const [tiposCambio, setTiposCambio] = useState<string[]>(() => initialData?.tiposCambio ?? []);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [planRows, setPlanRows] = useState<PlanActividad[]>(() => initialData?.plan ?? []);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [responsableSearchOpen, setResponsableSearchOpen] = useState(false);
  const [guideFieldId, setGuideFieldId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isTipoCambioOtros = tipoCambioSeleccionado === "OTROS";
  const isCurrentUserLeader = usuarioActual?.rol === "LIDER_PROCESO";
  const leaderOptions = isCurrentUserLeader
    ? lideresProceso.filter((usuario) => usuario.id !== usuarioActual.id)
    : lideresProceso;
  const responsableSearchValue = planForm.responsable;
  const responsablesFiltrados = useMemo(() => {
    const query = responsableSearchValue.trim().toLocaleLowerCase("es");
    if (!query) return usuariosResponsables.slice(0, 8);

    return usuariosResponsables
      .filter((usuario) =>
        [usuario.nombre, usuario.cargo, usuario.correo, usuario.proceso, usuario.empresa]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("es").includes(query)),
      )
      .slice(0, 8);
  }, [responsableSearchValue, usuariosResponsables]);

  const updateSolicitudValue = (fieldId: string, value: string) => {
    setSolicitudValues((current) => ({ ...current, [fieldId]: value }));
  };

  const updateAnalisisValue = (fieldId: string, value: string) => {
    setAnalisisValues((current) => ({ ...current, [fieldId]: value }));
  };

  const agregarTipoCambio = () => {
    if (!tipoCambioSeleccionado) return;
    if (isTipoCambioOtros && !cualTipoCambio.trim()) {
      setError("Especifique cuál es el otro tipo de cambio.");
      return;
    }

    const tipoCambio = isTipoCambioOtros && cualTipoCambio.trim() ? `OTROS - ${cualTipoCambio.trim()}` : tipoCambioSeleccionado;
    if (tiposCambio.includes(tipoCambio)) return;

    setError("");
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
    if (fieldId === "responsable") {
      setPlanForm((form) => ({
        ...form,
        responsableId: "",
        responsable: value,
      }));
      return;
    }
    if (fieldId === "actividades" || fieldId === "fecha") {
      setPlanForm((form) => ({ ...form, [fieldId]: value }));
    }
  };

  const seleccionarResponsablePlan = (usuario: UsuarioGestionCambio) => {
    setPlanForm((form) => ({
      ...form,
      responsableId: usuario.id,
      responsable: usuario.nombre,
    }));
    setResponsableSearchOpen(false);
  };

  const agregarPlan = () => {
    if (!planForm.actividades && !planForm.responsable && !planForm.fecha) return;
    if (!planForm.actividades.trim() || !planForm.responsableId || !planForm.fecha) {
      setError("Completa la actividad, selecciona un responsable y define la fecha antes de añadirla.");
      return;
    }

    setError("");
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
      responsableId: plan.responsableId ?? "",
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
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === "send-quality" ? "send-quality" : "draft";

    if (intent === "send-quality" && !liderProcesoId && !isCurrentUserLeader) {
      setError("Selecciona el líder del proceso antes de enviar el registro a Calidad.");
      return;
    }
    if (intent === "send-quality" && planRows.length === 0) {
      setError("Agrega al menos una actividad completa al plan de implementación.");
      return;
    }

    if (isTipoCambioOtros && !cualTipoCambio.trim()) {
      setError("Especifique cuál es el otro tipo de cambio.");
      return;
    }

    const pendingTipoCambio = getPendingTipoCambio();
    const finalTiposCambio = pendingTipoCambio && !tiposCambio.includes(pendingTipoCambio) ? [...tiposCambio, pendingTipoCambio] : tiposCambio;
    const analisis = Object.fromEntries(
      analisisFields.map((field) => {
        return [field.id, (analisisValues[field.id] ?? "").trim()];
      }),
    );

    setError("");
    const liderProceso = lideresProceso.find((usuario) => usuario.id === liderProcesoId);
    onSubmit?.({
      empresa: empresaActiva,
      liderProceso: liderProceso?.nombre ?? initialData?.liderProceso ?? (isCurrentUserLeader ? usuarioActual?.nombre : undefined),
      liderProcesoId: liderProcesoId || undefined,
      proceso: solicitudValues.proceso ?? "",
      tiposCambio: finalTiposCambio,
      analisis,
      plan: planRows,
    }, intent);
  };

  return (
    <form id={formId} onSubmit={submitSolicitud} className="space-y-4 text-[#08142f]">
        {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div> : null}

        <SectionWrapper title="1. SOLICITUD DEL CAMBIO" icon={<FilePenLine className="size-5" />}>
          <div className="space-y-4">
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                id="lider-proceso"
                label={isCurrentUserLeader ? "ASIGNAR A OTRO LÍDER RESPONSABLE" : "LÍDER DEL PROCESO"}
                type="select"
                placeholder={isCurrentUserLeader ? "Opcional: seleccione otro líder" : "Seleccione el líder responsable"}
                options={leaderOptions.map((usuario) => ({
                  value: usuario.id,
                  label: `${usuario.nombre}${usuario.proceso ? ` - ${usuario.proceso}` : ""}`,
                }))}
                value={liderProcesoId}
                onChange={(value) => {
                  setLiderProcesoId(value);
                  const lider = lideresProceso.find((usuario) => usuario.id === value);
                  if (lider?.proceso && !solicitudValues.proceso) {
                    updateSolicitudValue("proceso", lider.proceso);
                  }
                }}
              />

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
                label="Especifique cuál"
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
                <div className="grid grid-cols-[1fr_5rem] bg-[#eef3f8] text-xs font-black text-slate-700">
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
                        className="grid size-7 place-items-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar tipo de cambio"
                        onClick={() => eliminarTipoCambio(tipoCambio)}
                        className="grid size-7 place-items-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
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

        <SectionWrapper title="2. ANÁLISIS ASOCIADOS AL CAMBIO" icon={<ClipboardList className="size-5" />}>
          <div className="grid gap-4 md:grid-cols-2">
            {analisisFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <CustomInput
                  id={field.id}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  icon={analisisIcons[field.id]}
                  value={analisisValues[field.id] ?? ""}
                  onChange={(value) => updateAnalisisValue(field.id, value)}
                />
                <button
                  type="button"
                  onClick={() => setGuideFieldId(field.id)}
                  className="inline-flex items-center gap-1 text-xs font-black text-blue-700 transition hover:text-blue-900"
                >
                  <Info className="size-3.5" />
                  Ver preguntas guía
                </button>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <SectionWrapper title="3. PLAN PARA IMPLEMENTACIÓN DEL CAMBIO">
          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center gap-3 text-center lg:flex-row">
              <p className="text-sm font-bold italic text-[#08142f]">
                Escriba las actividades necesarias para la implementación del cambio propuesto, incluidas las actividades para control de riesgos SST y de impactos ambientales, luego oprima el botón
              </p>
            </div>

            <div className="grid items-end gap-4 lg:grid-cols-[minmax(18rem,1.2fr)_minmax(16rem,0.8fr)_minmax(12rem,0.45fr)]">
              {planFields.map((field) => (
                field.id === "responsable" ? (
                  <div key={field.id} className="relative">
                    <label htmlFor={field.id} className="flex items-center gap-2 text-[11px] font-black text-[#08142f]">
                      {field.label}
                    </label>
                    <div className="relative mt-2">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id={field.id}
                        value={planForm.responsable}
                        onFocus={() => setResponsableSearchOpen(true)}
                        onChange={(event) => {
                          actualizarPlanForm(field.id, event.target.value);
                          setResponsableSearchOpen(true);
                        }}
                        onBlur={() => window.setTimeout(() => setResponsableSearchOpen(false), 150)}
                        placeholder="Escriba para buscar usuario responsable"
                        autoComplete="off"
                        className="block h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 pl-10 pr-10 text-sm font-semibold text-[#08142f] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-600" />
                    </div>
                    {responsableSearchOpen ? (
                      <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-xl">
                        {responsablesFiltrados.length > 0 ? (
                          responsablesFiltrados.map((usuario) => (
                            <button
                              key={usuario.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => seleccionarResponsablePlan(usuario)}
                              className="flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left transition hover:bg-blue-50"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-[#08142f]">{usuario.nombre}</span>
                                <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                                  {[usuario.cargo, usuario.proceso, usuario.correo].filter(Boolean).join(" · ")}
                                </span>
                              </span>
                              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase text-blue-700">
                                {usuario.empresa}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-3 text-sm font-semibold text-slate-500">No hay usuarios que coincidan con la búsqueda.</p>
                        )}
                      </div>
                    ) : null}
                    {planForm.responsable && !planForm.responsableId ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700">Selecciona un usuario de la lista para asociarlo al registro.</p>
                    ) : null}
                  </div>
                ) : (
                <CustomInput
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={planForm[field.id]}
                  onChange={(value) => actualizarPlanForm(field.id, value)}
                />
                )
              ))}
            </div>

            <div className="flex justify-center">
              <ButtonAdd label={editingPlanId === null ? "Añadir Actividad" : "Actualizar Actividad"} onClick={agregarPlan} variant="text" />
            </div>

            {planRows.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
                <div className="grid grid-cols-[1.4fr_1fr_9rem_5rem] bg-[#eef3f8] text-xs font-black text-slate-700">
                  <div className="px-4 py-2 text-center">ACTIVIDADES</div>
                  <div className="border-l border-emerald-800 px-4 py-2 text-center">RESPONSABLE</div>
                  <div className="border-l border-emerald-800 px-4 py-2 text-center">FECHA</div>
                  <div className="border-l border-emerald-800 px-3 py-2 text-center">ACCIÓN</div>
                </div>
                {planRows.map((plan) => (
                  <div
                    key={plan.id}
                    className="grid grid-cols-[1.4fr_1fr_9rem_5rem] items-center border-t border-slate-200 text-sm text-[#08142f] even:bg-slate-50"
                  >
                    <div className="px-4 py-2 text-center">{plan.actividades}</div>
                    <div className="border-l border-slate-200 px-4 py-2 text-center">{plan.responsable}</div>
                    <div className="border-l border-slate-200 px-4 py-2 text-center">{plan.fecha}</div>
                    <div className="flex items-center justify-center gap-2 border-l border-slate-200 px-3 py-2">
                      <button
                        type="button"
                        aria-label="Editar fila del plan"
                        onClick={() => editarPlan(plan)}
                        className="grid size-7 place-items-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Eliminar fila del plan"
                        onClick={() => eliminarPlan(plan.id)}
                        className="grid size-7 place-items-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
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

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-1 pt-5 sm:flex-row sm:justify-end">
          <button
            type="submit"
            name="intent"
            value="draft"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
          >
            Guardar borrador
          </button>
          <button
            type="submit"
            name="intent"
            value="send-quality"
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
          >
            {isCurrentUserLeader && !liderProcesoId ? "Enviar a Calidad" : "Enviar al líder del proceso"}
          </button>
        </div>

        {guideFieldId ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-base font-black text-[#08142f]">Preguntas guía</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {analisisFields.find((field) => field.id === guideFieldId)?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGuideFieldId(null)}
                  className="grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100"
                  aria-label="Cerrar preguntas guía"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ul className="space-y-2 px-4 py-4 text-sm leading-6 text-slate-700">
                {(analisisGuideQuestions[guideFieldId as keyof typeof analisisGuideQuestions] ?? []).map((question) => (
                  <li key={question} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
    </form>
  );
}

export const GestionCambiosForm = SolicitudCambioForm;
