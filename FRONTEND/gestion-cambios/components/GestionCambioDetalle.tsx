"use client";

import {
  Building2,
  CalendarDays,
  Clock3,
  Download,
  FilePenLine,
  Hash,
  MessageSquareText,
  ShieldCheck,
  Tag,
  TriangleAlert,
  UserCheck,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { analisisFields } from "./formData";
import { canDownloadGestionCambioPdf, downloadGestionCambioPdf } from "./GestionCambioPdf";
import type { AprobacionCambioData, GestionCambio, GestionCambioWorkflowAction, SeguimientoCambioData, UsuarioGestionCambio } from "./types";
import {
  estadoBadgeClassName,
  estadoLabels,
  getEffectiveEstado,
  getEstadoCierre,
  hasApproverDecision,
  roleLabels,
} from "./workflow";

export type WorkflowPayload = {
  observacionesCorreccion?: string;
  validacionCalidad?: string;
  aprobadorSeleccionadoId?: string;
  aprobacion?: AprobacionCambioData;
  seguimiento?: SeguimientoCambioData;
};

type GestionCambioDetalleProps = {
  registro: GestionCambio;
  showApprovalActions?: boolean;
  usuarioActual?: UsuarioGestionCambio;
  responsablesAprobacion?: UsuarioGestionCambio[];
  onEdit?: () => void;
  onWorkflowAction?: (action: GestionCambioWorkflowAction, payload?: WorkflowPayload) => void;
};

const inputClassName =
  "mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100";

const actionLabels: Record<GestionCambioWorkflowAction, string> = {
  CREAR_REGISTRO: "Crea el registro",
  GUARDAR_BORRADOR: "Guarda borrador",
  ENVIAR_LIDER: "Envía al líder del proceso",
  ENVIAR_CALIDAD: "Envía a Calidad",
  APROBAR_LIDER: "Líder aprueba y remite a Calidad",
  RECHAZAR_LIDER: "Líder rechaza el cambio",
  REENVIAR_CALIDAD: "Envía a revisión de Calidad",
  SOLICITAR_CORRECCION: "Calidad devuelve al líder",
  VALIDAR_REMITIR: "Calidad valida y remite a aprobación",
  REGISTRAR_APROBACION: "Responsable aprueba el cambio",
  REGISTRAR_RECHAZO: "Responsable rechaza el cambio",
  CERRAR_FORMATO: "Calidad cierra el formato",
};

function formatTimelineDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

function DetailItem({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <p className="flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 sm:justify-start">
        {icon ? <span className="text-blue-600">{icon}</span> : null}
        {label}
      </p>
      <div className="mt-1.5 text-center text-sm font-black leading-5 text-[#111a32] sm:text-left">{value || "Sin diligenciar"}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        {icon ? <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</span> : null}
        <div>
          <h3 className="text-base font-black text-[#111a32]">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm font-medium leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function formatDisplayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(date);
}

function TableHeadLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-blue-600">{icon}</span>
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900"
    >
      {children}
    </button>
  );
}

function FirmaPlaceholderButton({ label = "Firmar" }: { label?: string }) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Firma</span>
      <button
        type="button"
        disabled
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-400"
        title="La firma será gestionada desde ROCA."
      >
        <FilePenLine className="size-4" />
        {label}
      </button>
    </div>
  );
}

function createApprovalDraft(usuario?: UsuarioGestionCambio): AprobacionCambioData {
  return {
    aprobado: "SI",
    nombre: usuario?.nombre ?? "",
    cargo: usuario?.cargo ?? roleLabels[usuario?.rol ?? "GERENCIA_ADMINISTRATIVA"],
    fecha: "",
    observaciones: "",
    rolAprobador: usuario?.rol ?? "GERENCIA_ADMINISTRATIVA",
  };
}

export function GestionCambioDetalle({
  registro,
  showApprovalActions = false,
  usuarioActual,
  responsablesAprobacion = [],
  onEdit,
  onWorkflowAction,
}: GestionCambioDetalleProps) {
  const [calidadAprueba, setCalidadAprueba] = useState<"SI" | "NO">("SI");
  const [observacionesCorreccion, setObservacionesCorreccion] = useState(registro.observacionesCorreccion ?? "");
  const [aprobacion, setAprobacion] = useState<AprobacionCambioData>(() => createApprovalDraft(usuarioActual));
  const [seguimiento, setSeguimiento] = useState<SeguimientoCambioData>(
    registro.seguimiento ?? {
      cambioEficaz: "",
      observaciones: "",
      acciones: "",
      nombreCierre: usuarioActual?.nombre ?? "",
      cargoCierre: usuarioActual?.cargo ?? roleLabels[usuarioActual?.rol ?? "GESTION_CALIDAD"],
      fechaSeguimiento: new Date().toISOString().slice(0, 10),
      fechaCierre: new Date().toISOString().slice(0, 10),
    },
  );
  const [aprobadorSeleccionadoId, setAprobadorSeleccionadoId] = useState(registro.aprobadorSeleccionadoId ?? responsablesAprobacion[0]?.id ?? "");
  const [error, setError] = useState("");
  const [timelineOpen, setTimelineOpen] = useState(false);

  const isQualityReview = registro.estado === "EN_REVISION_CALIDAD" && usuarioActual?.rol === "GESTION_CALIDAD";
  const isQualityFollowup = registro.estado === "EN_SEGUIMIENTO_CALIDAD" && usuarioActual?.rol === "GESTION_CALIDAD";
  const isLeaderApprovalTurn =
    registro.estado === "PENDIENTE_APROBACION_LIDER" &&
    usuarioActual?.rol === "LIDER_PROCESO" &&
    registro.responsableActualId === usuarioActual.id;
  const isApproverTurn =
    registro.estado === "PENDIENTE_APROBACION" &&
    usuarioActual &&
    !hasApproverDecision(registro, usuarioActual) &&
    (registro.responsableActualId === usuarioActual.id || (!registro.responsableActualId && registro.responsableActual === usuarioActual.rol));
  const canReenterQuality = Boolean(
    usuarioActual &&
      (registro.estado === "BORRADOR" ||
        registro.estado === "DEVUELTO_LIDER" ||
        registro.estado === "RECHAZADO_LIDER" ||
        registro.estado === "RECHAZADO_APROBADOR") &&
      (registro.creadorId === usuarioActual.id || registro.liderProcesoId === usuarioActual.id),
  );
  const estadoActual = getEffectiveEstado(registro);
  const canExportPdf = canDownloadGestionCambioPdf(registro);
  const latestSelectedApprover = registro.historial
    .filter((decision) => decision.aprobadorSeleccionadoNombre)
    .at(-1);
  const aprobadorGestionadoNombre = registro.aprobadorSeleccionadoNombre ?? latestSelectedApprover?.aprobadorSeleccionadoNombre;
  const responsablesPlan = Array.from(
    new Set(registro.detalle.plan.map((plan) => plan.responsable).filter((responsable) => responsable.trim())),
  );

  useEffect(() => {
    if (!error) return;

    const timeout = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    setAprobacion(createApprovalDraft(usuarioActual));
  }, [registro.id, registro.estado, usuarioActual?.id, usuarioActual?.nombre, usuarioActual?.cargo, usuarioActual?.rol]);

  const requireText = (value: string, message: string) => {
    if (value.trim()) return true;
    setError(message);
    return false;
  };

  const requestLeaderCorrection = () => {
    if (!requireText(observacionesCorreccion, "Falta diligenciar el campo: Observaciones para devolver al líder.")) return;
    setError("");
    onWorkflowAction?.("SOLICITAR_CORRECCION", { observacionesCorreccion });
  };

  const saveQualityReview = () => {
    if (calidadAprueba === "NO") {
      requestLeaderCorrection();
      return;
    }
    if (!requireText(aprobadorSeleccionadoId, "Falta diligenciar el campo: Enviar para aprobación a.")) return;

    const aprobador = responsablesAprobacion.find((responsable) => responsable.id === aprobadorSeleccionadoId);

    setError("");
    onWorkflowAction?.("VALIDAR_REMITIR", {
      aprobadorSeleccionadoId,
      validacionCalidad: observacionesCorreccion.trim()
        ? `Calidad aprueba la revisión inicial y remite a ${aprobador?.nombre ?? "el aprobador seleccionado"}. Observaciones: ${observacionesCorreccion.trim()}`
        : `Calidad aprueba la revisión inicial y remite a ${aprobador?.nombre ?? "el aprobador seleccionado"}.`,
    });
  };

  const registerApprovalDecision = () => {
    if (!requireText(aprobacion.observaciones, "Falta diligenciar el campo: Observaciones de aprobación.")) return;
    setError("");
    const action = isLeaderApprovalTurn
      ? aprobacion.aprobado === "SI"
        ? "APROBAR_LIDER"
        : "RECHAZAR_LIDER"
      : aprobacion.aprobado === "SI"
        ? "REGISTRAR_APROBACION"
        : "REGISTRAR_RECHAZO";
    onWorkflowAction?.(action, { aprobacion });
  };

  const validateSeguimiento = () => {
    if (!seguimiento.cambioEficaz) {
      setError("Falta diligenciar el campo: ¿El cambio fue eficaz?");
      return false;
    }
    if (seguimiento.cambioEficaz === "NO" && !requireText(seguimiento.observaciones, "Falta diligenciar el campo: Observaciones del seguimiento.")) return false;
    if (!requireText(seguimiento.acciones, "Falta diligenciar el campo: Acciones a tomar.")) return false;
    setError("");
    return true;
  };

  const closeFormat = () => {
    if (!validateSeguimiento()) return;
    if (seguimiento.cambioEficaz !== "SI") {
      setError("Un cambio no eficaz no puede finalizarse como aprobado. Registra las acciones requeridas y mantén el seguimiento abierto.");
      return;
    }
    setError("");
    onWorkflowAction?.("CERRAR_FORMATO", { seguimiento });
  };

  const exportPdf = async () => {
    await downloadGestionCambioPdf(registro, window.location.origin);
  };

  const renderRevisionCalidad = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-black text-slate-950">Revisión inicial de Calidad</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Si el cambio está documentado, Calidad selecciona el aprobador y remite el registro. Si falta información, vuelve al líder con observaciones.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-[#e6f0df] px-4 py-2 text-center text-sm font-black uppercase tracking-wide text-slate-950">
          Revisión de cumplimiento por Calidad
        </div>
        <div className="grid gap-4 border-b border-slate-300 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <p className="text-sm font-semibold text-slate-950">¿La información cumple los requisitos para continuar?</p>
          <label className="inline-flex items-center gap-3 text-sm font-semibold uppercase text-slate-950">
            SI
            <input
              type="checkbox"
              checked={calidadAprueba === "SI"}
              onChange={() => setCalidadAprueba("SI")}
              className="size-5 cursor-pointer border-slate-500"
            />
          </label>
          <label className="inline-flex items-center gap-3 text-sm font-semibold uppercase text-slate-950">
            NO
            <input
              type="checkbox"
              checked={calidadAprueba === "NO"}
              onChange={() => setCalidadAprueba("NO")}
              className="size-5 cursor-pointer border-slate-500"
            />
          </label>
        </div>

        <label className="block px-4 py-4">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Observaciones</span>
          <textarea
            value={observacionesCorreccion}
            onChange={(event) => setObservacionesCorreccion(event.target.value)}
            className={`${inputClassName} min-h-20`}
            placeholder={calidadAprueba === "SI" ? "Registra el resultado de la revisión de cumplimiento." : "Indica qué debe corregir el creador o líder de proceso."}
          />
        </label>

        {calidadAprueba === "SI" ? (
          <div className="space-y-5 border-t border-slate-300 px-4 py-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Enviar para aprobación a</span>
              <select
                value={aprobadorSeleccionadoId}
                onChange={(event) => setAprobadorSeleccionadoId(event.target.value)}
                className={`${inputClassName} bg-white`}
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
            <FirmaPlaceholderButton />
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={saveQualityReview}>{calidadAprueba === "SI" ? "Validar cumplimiento y remitir" : "Solicitar corrección"}</PrimaryButton>
      </div>
    </div>
  );

  const renderAprobacionCambio = () => (
    <div className="space-y-5">
      <div>
          <h3 className="text-base font-black text-slate-950">
            {isLeaderApprovalTurn ? "Aprobación del líder del proceso" : "Aprobación del cambio"}
          </h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Responsable actual: {registro.responsableActualNombre ?? roleLabels[registro.responsableActual]}.
        </p>
      </div>

      <div className="rounded-md border border-slate-300 bg-white p-4">
        <p className="text-xs font-black uppercase text-slate-600">¿El cambio solicitado es aprobado?</p>
        <div className="mt-3 inline-flex overflow-hidden rounded-md border border-slate-300">
          <button
            type="button"
            onClick={() => setAprobacion((current) => ({ ...current, aprobado: "SI" }))}
            className={`h-10 px-5 text-sm font-bold transition ${
              aprobacion.aprobado === "SI" ? "bg-emerald-800 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setAprobacion((current) => ({ ...current, aprobado: "NO" }))}
            className={`h-10 border-l border-slate-300 px-5 text-sm font-bold transition ${
              aprobacion.aprobado === "NO" ? "bg-red-700 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            No
          </button>
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-wide text-slate-600">Observaciones de aprobación</span>
        <textarea value={aprobacion.observaciones} onChange={(event) => setAprobacion((current) => ({ ...current, observaciones: event.target.value }))} className={`${inputClassName} min-h-20`} placeholder="Registra las observaciones de la aprobación o rechazo." />
      </label>

      <FirmaPlaceholderButton />

      <div className="flex justify-end">
        <PrimaryButton onClick={registerApprovalDecision}>{aprobacion.aprobado === "SI" ? "Aprobar cambio" : "Rechazar cambio"}</PrimaryButton>
      </div>
    </div>
  );

  const renderSeguimientoCambio = () => (
    <div className="space-y-5">
      <div className="flex justify-center">
        <span className="inline-flex rounded-md border border-emerald-900 bg-white px-4 py-2 text-xs font-black uppercase text-emerald-950 shadow-md">
          4. Seguimiento al cambio
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">¿El cambio fue eficaz?</span>
          <select
            value={seguimiento.cambioEficaz}
            onChange={(event) =>
              setSeguimiento((current) => {
                const cambioEficaz = event.target.value as SeguimientoCambioData["cambioEficaz"];
                return { ...current, cambioEficaz, observaciones: cambioEficaz === "SI" ? "" : current.observaciones };
              })
            }
            className={inputClassName}
          >
            <option value="">Seleccione una opción</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Observaciones</span>
          <textarea value={seguimiento.observaciones} onChange={(event) => setSeguimiento((current) => ({ ...current, observaciones: event.target.value }))} className={`${inputClassName} min-h-16`} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Acciones a tomar</span>
          <textarea value={seguimiento.acciones} onChange={(event) => setSeguimiento((current) => ({ ...current, acciones: event.target.value }))} className={`${inputClassName} min-h-16`} />
        </label>
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={closeFormat}>Finalizar como aprobado</PrimaryButton>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 text-[#111a32]">
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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 bg-[radial-gradient(circle_at_92%_0%,rgba(16,185,129,0.12),transparent_36%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <ShieldCheck className="size-7" />
            </span>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.34em] text-emerald-700">Vista previa</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#071127]">Gestión de Cambio</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{registro.codigo} · {registro.empresa}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-black ${estadoBadgeClassName[estadoActual]}`}>
              {estadoLabels[estadoActual]}
            </span>
            <button
              type="button"
              onClick={() => setTimelineOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 shadow-sm transition hover:border-blue-500 hover:text-blue-700"
            >
              <Clock3 className="size-4" />
              Historial
            </button>
            {canExportPdf ? (
              <button
                type="button"
                onClick={exportPdf}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Download className="size-4" />
                PDF
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <DetailItem label="Código" value={registro.codigo} icon={<Hash className="size-4" />} />
        <DetailItem label="Fecha" value={formatDisplayDate(registro.fechaHora ?? registro.fecha)} icon={<CalendarDays className="size-4 text-emerald-600" />} />
        <DetailItem label="Empresa" value={registro.empresa} icon={<Building2 className="size-4 text-violet-600" />} />
        <DetailItem label="Proceso" value={registro.detalle.proceso} icon={<Workflow className="size-4" />} />
        <DetailItem label="Tipo de cambio" value={registro.tipoCambio} icon={<Tag className="size-4 text-orange-600" />} />
        <DetailItem label="Responsable actual" value={registro.responsableActualNombre ?? roleLabels[registro.responsableActual]} icon={<UserCheck className="size-4" />} />
      </section>

      <section>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#111a32]">Responsables del registro</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Personas asociadas al flujo de gestión del cambio.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Creador</p>
              <p className="mt-2 text-sm font-black uppercase text-[#111a32]">{registro.creadorNombre ?? registro.creadorId}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Líder de proceso</p>
              <p className="mt-2 text-sm font-black uppercase text-[#111a32]">{registro.liderProceso}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Aprobador seleccionado por Calidad</p>
              <p className="mt-2 text-sm font-black uppercase text-[#111a32]">{aprobadorGestionadoNombre || "Pendiente por Calidad"}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Responsables del plan</p>
              <p className="mt-2 text-sm font-black uppercase text-[#111a32]">
                {responsablesPlan.length > 0 ? responsablesPlan.join(", ") : "Sin actividades asignadas"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Cierre</p>
              <p className="mt-2 text-sm font-black uppercase text-[#111a32]">{getEstadoCierre(registro) || "Sin cierre"}</p>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="Observaciones" subtitle="Registro de revisión, aprobación y seguimiento." icon={<MessageSquareText className="size-5" />}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Calidad</p>
            <div className="mt-2 min-h-20 rounded-lg bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
              {registro.validacionCalidad || registro.observacionesCorreccion || "Sin observaciones registradas."}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Aprobación / seguimiento</p>
            <div className="mt-2 min-h-20 rounded-lg bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-900">
              {registro.aprobacion?.observaciones || registro.seguimiento?.observaciones || "Pendiente de gestión."}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Análisis asociados al cambio" subtitle="Información registrada sobre impactos, riesgos y elementos afectados." icon={<Tag className="size-5" />}>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {analisisFields.map((field) => (
            <DetailItem key={field.id} label={field.label} value={registro.detalle.analisis[field.id]} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Plan para implementación" subtitle="Actividades, responsables y fechas definidas para ejecutar el cambio." icon={<Workflow className="size-5" />}>
        {registro.detalle.plan.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-[1.4fr_1fr_9rem] border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-blue-50 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
              <div className="px-4 py-3"><TableHeadLabel icon={<Workflow className="size-3.5" />}>Actividades</TableHeadLabel></div>
              <div className="border-l border-slate-200 px-4 py-3"><TableHeadLabel icon={<UserCheck className="size-3.5" />}>Responsable</TableHeadLabel></div>
              <div className="border-l border-slate-200 px-4 py-3"><TableHeadLabel icon={<CalendarDays className="size-3.5" />}>Fecha</TableHeadLabel></div>
            </div>
            {registro.detalle.plan.map((plan) => (
              <div key={plan.id} className="grid grid-cols-[1.4fr_1fr_9rem] border-t border-slate-100 text-sm transition hover:bg-blue-50/40">
                <div className="px-4 py-4 font-semibold text-slate-950">{plan.actividades}</div>
                <div className="border-l border-slate-100 px-4 py-4">{plan.responsable}</div>
                <div className="border-l border-slate-100 px-4 py-4">{plan.fecha}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No se agregaron actividades al plan.</p>
        )}
      </SectionCard>

      {showApprovalActions ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <FilePenLine className="size-5" />
            </span>
            <div className="w-full space-y-5">
              <div>
                <h3 className="text-base font-black text-[#111a32]">Acciones del flujo</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">Solo se habilitan las acciones correspondientes al responsable actual.</p>
              </div>

              {isQualityReview ? renderRevisionCalidad() : null}

              {canReenterQuality ? (
                <div className="space-y-4">
                  <DetailItem
                    label={
                      registro.estado === "RECHAZADO_LIDER"
                        ? "Observaciones del líder"
                        : registro.estado === "RECHAZADO_APROBADOR"
                          ? "Observaciones del aprobador"
                          : "Observaciones de Calidad"
                    }
                    value={registro.aprobacion?.observaciones ?? registro.observacionesCorreccion}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={onEdit} className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800">
                      Editar formato
                    </button>
                  </div>
                </div>
              ) : null}

              {isLeaderApprovalTurn || isApproverTurn ? renderAprobacionCambio() : null}
              {isQualityFollowup ? renderSeguimientoCambio() : null}
              {registro.estado === "APROBADO" || registro.estado === "CERRADO" ? <p className="text-sm font-bold text-emerald-700">El cambio fue finalizado como aprobado.</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {timelineOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4">
          <section className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-950">Pasos de Aprobación</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{registro.codigo}</p>
              </div>
              <button
                type="button"
                onClick={() => setTimelineOpen(false)}
                className="grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100"
                aria-label="Cerrar línea de tiempo"
              >
                <X className="size-4" />
              </button>
            </header>
            <div className="overflow-y-auto p-4">
              <div className="overflow-hidden rounded-md border border-slate-200">
                {registro.historial.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {[...registro.historial]
                      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                      .map((evento) => (
                        <div key={`${evento.fecha}-${evento.accion}`} className="grid gap-2 bg-white px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_12rem] md:items-center">
                          <div>
                            <p className="font-bold text-slate-950">{actionLabels[evento.accion]}</p>
                            <p className="text-xs font-semibold text-slate-500">{evento.usuario}</p>
                          </div>
                          <div>
                            {evento.estadoNuevo ? (
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${estadoBadgeClassName[evento.estadoNuevo]}`}>
                                {estadoLabels[evento.estadoNuevo]}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs font-semibold text-slate-500 md:text-right">{formatTimelineDate(evento.fecha)}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="p-4 text-sm text-slate-500">Sin movimientos registrados.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
