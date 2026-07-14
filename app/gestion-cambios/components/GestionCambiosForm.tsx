"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FilePenLine,
  FileText,
  GitBranch,
  Hash,
  Info,
  Leaf,
  ListChecks,
  Pencil,
  Search,
  ShieldAlert,
  Tag,
  Trash2,
  TriangleAlert,
  UserCheck,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
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
  documentos: <FileText className="size-4 text-rose-600" />,
  procesos: <GitBranch className="size-4 text-blue-600" />,
  personas: <Users className="size-4 text-sky-700" />,
  instalaciones: <Building2 className="size-4 text-orange-600" />,
  "tecnologia-maquinaria": <Wrench className="size-4 text-violet-600" />,
  "riesgos-organizacionales": <TriangleAlert className="size-4 text-amber-600" />,
  "peligros-riesgos": <ShieldAlert className="size-4 text-red-600" />,
  "aspectos-impactos-ambientales": <Leaf className="size-4 text-emerald-600" />,
};

const solicitudIcons: Record<string, React.ReactNode> = {
  proceso: <Hash className="size-4 text-blue-600" />,
};

const planIcons: Record<string, React.ReactNode> = {
  actividades: <ListChecks className="size-4 text-fuchsia-600" />,
  responsable: <UserCheck className="size-4 text-sky-700" />,
  fecha: <CalendarDays className="size-4 text-rose-600" />,
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

  useEffect(() => {
    if (!error) return;

    const timeout = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const showMissingField = (fieldName: string) => {
    setError(`Falta diligenciar el campo: ${fieldName}.`);
  };

  const updateSolicitudValue = (fieldId: string, value: string) => {
    setSolicitudValues((current) => ({ ...current, [fieldId]: value }));
  };

  const updateAnalisisValue = (fieldId: string, value: string) => {
    setAnalisisValues((current) => ({ ...current, [fieldId]: value }));
  };

  const agregarTipoCambio = () => {
    if (!tipoCambioSeleccionado) {
      showMissingField("Tipo de cambio");
      return;
    }
    if (isTipoCambioOtros && !cualTipoCambio.trim()) {
      showMissingField("Especifique cuál es el tipo de cambio");
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
    if (!planForm.actividades.trim()) {
      showMissingField("Actividades del plan");
      return;
    }
    if (!planForm.responsableId) {
      if (planForm.responsable.trim()) {
        setError("Selecciona un usuario responsable de la lista para asociarlo al plan.");
        return;
      }
      showMissingField("Responsable del plan");
      return;
    }
    if (!planForm.fecha) {
      showMissingField("Fecha del plan");
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

    if (intent === "send-quality" && !solicitudValues.proceso?.trim()) {
      showMissingField("Proceso");
      return;
    }
    if (intent === "send-quality" && !liderProcesoId && !isCurrentUserLeader) {
      showMissingField("Líder del proceso");
      return;
    }

    if (intent === "send-quality" && !tipoCambioSeleccionado && tiposCambio.length === 0) {
      showMissingField("Tipo de cambio");
      return;
    }

    if (isTipoCambioOtros && !cualTipoCambio.trim()) {
      showMissingField("Especifique cuál es el tipo de cambio");
      return;
    }

    const pendingTipoCambio = getPendingTipoCambio();
    const finalTiposCambio = pendingTipoCambio && !tiposCambio.includes(pendingTipoCambio) ? [...tiposCambio, pendingTipoCambio] : tiposCambio;

    if (intent === "send-quality") {
      const missingAnalisisField = analisisFields.find((field) => !(analisisValues[field.id] ?? "").trim());
      if (missingAnalisisField) {
        showMissingField(missingAnalisisField.label);
        return;
      }

      if (planRows.length === 0) {
        showMissingField("Plan para implementación del cambio");
        return;
      }
    }

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
        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-[95] w-[min(92vw,26rem)] rounded-lg border border-amber-200 bg-white p-4 text-[#08142f] shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700">
                <TriangleAlert className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">Campo pendiente</p>
                <p className="mt-1 text-sm font-bold leading-5 text-slate-800">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar mensaje de validación"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        ) : null}

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
                  icon={solicitudIcons[field.id]}
                  value={solicitudValues[field.id] ?? ""}
                  onChange={(value) => updateSolicitudValue(field.id, value)}
                />
              ))}

              <CustomInput
                id="lider-proceso"
                label={isCurrentUserLeader ? "ASIGNAR A OTRO LÍDER RESPONSABLE" : "LÍDER DEL PROCESO"}
                type="select"
                placeholder={isCurrentUserLeader ? "Opcional: seleccione otro líder" : "Seleccione el líder responsable"}
                icon={<UserRound className="size-4 text-sky-700" />}
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
                icon={<Tag className="size-4 text-fuchsia-600" />}
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
                icon={<FileText className="size-4 text-rose-600" />}
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

        <SectionWrapper title="3. PLAN PARA IMPLEMENTACIÓN DEL CAMBIO" icon={<ClipboardList className="size-5" />}>
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold leading-6 text-slate-600">
                Registre las actividades necesarias para implementar el cambio, incluyendo controles de riesgos SST e impactos ambientales.
              </p>
            </div>

            <div className="grid items-end gap-x-4 gap-y-4 lg:grid-cols-[minmax(18rem,1.15fr)_minmax(16rem,0.9fr)_minmax(12rem,0.45fr)]">
              {planFields.map((field) => (
                field.id === "responsable" ? (
                  <div key={field.id} className="relative">
                    <label htmlFor={field.id} className="flex items-center gap-2 text-xs font-bold leading-4 text-[#020a1f]">
                      <span className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">{planIcons[field.id]}</span>
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
                        className="block h-10 w-full rounded-md border border-[#b8c2cf] bg-white px-3 py-2 pl-10 pr-10 text-sm font-medium text-[#18314f] outline-none transition placeholder:text-[#8a9ab5] focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
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
                  icon={planIcons[field.id]}
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
