"use client";

import { CalendarDays, FilePenLine, PlusCircle, UserCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { analisisFields } from "./formData";
import type { AprobacionCambioData, GestionCambio, GestionCambioWorkflowAction, SeguimientoCambioData, UsuarioGestionCambio } from "./types";
import {
  canEditCorrection,
  estadoBadgeClassName,
  estadoLabels,
  getDiasRestantes,
  getEffectiveEstado,
  getEstadoCierre,
  hasApproverDecision,
  hasQualityInitialReview,
  roleLabels,
} from "./workflow";

export type WorkflowPayload = {
  observacionesCorreccion?: string;
  validacionCalidad?: string;
  aprobacion?: AprobacionCambioData;
  seguimiento?: SeguimientoCambioData;
};

type GestionCambioDetalleProps = {
  registro: GestionCambio;
  showApprovalActions?: boolean;
  usuarioActual?: UsuarioGestionCambio;
  onEdit?: () => void;
  onWorkflowAction?: (action: GestionCambioWorkflowAction, payload?: WorkflowPayload) => void;
};

const inputClassName =
  "mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100";

const actionLabels: Record<GestionCambioWorkflowAction, string> = {
  CREAR_REGISTRO: "Líder identifica el cambio",
  COMPLETAR_SOLICITUD: "Diligencia SIG-F006 y define plan",
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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-semibold leading-6 text-slate-950">{value || "Sin diligenciar"}</div>
    </div>
  );
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

export function GestionCambioDetalle({
  registro,
  showApprovalActions = false,
  usuarioActual,
  onEdit,
  onWorkflowAction,
}: GestionCambioDetalleProps) {
  const [calidadAprueba, setCalidadAprueba] = useState<"SI" | "NO">("SI");
  const [observacionesCorreccion, setObservacionesCorreccion] = useState(registro.observacionesCorreccion ?? "");
  const [aprobacion, setAprobacion] = useState<AprobacionCambioData>(
    registro.aprobacion ?? {
      aprobado: "SI",
      nombre: usuarioActual?.nombre ?? "",
      cargo: roleLabels[usuarioActual?.rol ?? "GERENCIA_ADMINISTRATIVA"],
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: "",
      rolAprobador: usuarioActual?.rol ?? "GERENCIA_ADMINISTRATIVA",
    },
  );
  const [seguimiento, setSeguimiento] = useState<SeguimientoCambioData>(
    registro.seguimiento ?? {
      cambioEficaz: "",
      observaciones: "",
      acciones: "",
      nombreCierre: usuarioActual?.nombre ?? "",
      cargoCierre: roleLabels[usuarioActual?.rol ?? "GESTION_CALIDAD"],
      fechaSeguimiento: new Date().toISOString().slice(0, 10),
      fechaCierre: new Date().toISOString().slice(0, 10),
    },
  );
  const [seguimientoAgregado, setSeguimientoAgregado] = useState(Boolean(registro.seguimiento));
  const [error, setError] = useState("");

  const isQualityReview = registro.estado === "EN_REVISION_CALIDAD" && usuarioActual?.rol === "GESTION_CALIDAD" && !hasQualityInitialReview(registro);
  const isQualityFollowup = registro.estado === "EN_SEGUIMIENTO_CALIDAD" && usuarioActual?.rol === "GESTION_CALIDAD";
  const isApproverTurn =
    registro.estado === "PENDIENTE_APROBACION" &&
    usuarioActual &&
    !hasApproverDecision(registro, usuarioActual) &&
    (registro.responsableActualId === usuarioActual.id || (!registro.responsableActualId && registro.responsableActual === usuarioActual.rol));
  const canReenterQuality = Boolean(
    usuarioActual &&
      (registro.estado === "CREADO" || registro.estado === "DEVUELTO_LIDER" || registro.estado === "RECHAZADO_APROBADOR") &&
      (registro.creadorId === usuarioActual.id || registro.liderProcesoId === usuarioActual.id),
  );
  const estadoActual = getEffectiveEstado(registro);
  const diasRestantes = getDiasRestantes(registro.fechaLimiteCierre);

  const requireText = (value: string, message: string) => {
    if (value.trim()) return true;
    setError(message);
    return false;
  };

  const requestLeaderCorrection = () => {
    if (!requireText(observacionesCorreccion, "Escribe las observaciones para devolver el registro al líder.")) return;
    setError("");
    onWorkflowAction?.("SOLICITAR_CORRECCION", { observacionesCorreccion });
  };

  const saveQualityReview = () => {
    if (calidadAprueba === "NO") {
      requestLeaderCorrection();
      return;
    }

    setError("");
    onWorkflowAction?.("VALIDAR_REMITIR", {
      validacionCalidad: observacionesCorreccion.trim()
        ? `Calidad aprueba la revisión inicial. Observaciones: ${observacionesCorreccion.trim()}`
        : "Calidad aprueba la revisión inicial y confirma que el cambio está correctamente documentado.",
    });
  };

  const registerApprovalDecision = () => {
    if (!requireText(aprobacion.nombre, "El nombre del aprobador es obligatorio.")) return;
    if (!requireText(aprobacion.cargo, "El cargo del aprobador es obligatorio.")) return;
    if (!requireText(aprobacion.fecha, "La fecha de aprobación es obligatoria.")) return;
    if (!requireText(aprobacion.observaciones, "Las observaciones de aprobación son obligatorias.")) return;
    setError("");
    onWorkflowAction?.(aprobacion.aprobado === "SI" ? "REGISTRAR_APROBACION" : "REGISTRAR_RECHAZO", { aprobacion });
  };

  const validateSeguimiento = () => {
    if (!seguimiento.cambioEficaz) {
      setError("Selecciona si el cambio fue eficaz.");
      return false;
    }
    if (seguimiento.cambioEficaz === "NO" && !requireText(seguimiento.observaciones, "Las observaciones del seguimiento son obligatorias cuando el cambio no fue eficaz.")) return false;
    if (!requireText(seguimiento.acciones, "Las acciones del seguimiento son obligatorias.")) return false;
    if (!requireText(seguimiento.nombreCierre, "El nombre de quien realiza seguimiento y cierre es obligatorio.")) return false;
    if (!requireText(seguimiento.cargoCierre, "El cargo es obligatorio.")) return false;
    if (!requireText(seguimiento.fechaSeguimiento, "La fecha de seguimiento es obligatoria.")) return false;
    if (!requireText(seguimiento.fechaCierre, "La fecha de cierre es obligatoria.")) return false;
    setError("");
    return true;
  };

  const addSeguimiento = () => {
    if (!validateSeguimiento()) return;
    setSeguimientoAgregado(true);
  };

  const closeFormat = () => {
    if (!validateSeguimiento()) return;
    setError("");
    onWorkflowAction?.("CERRAR_FORMATO", { seguimiento });
  };

  const renderRevisionCalidad = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-black text-slate-950">Revisión inicial de Calidad</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Si el cambio está documentado, se remite a {registro.aprobadorSeleccionadoNombre ?? "el responsable seleccionado"}. Si falta información, vuelve al líder con observaciones.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
        <div className="border-b border-slate-300 bg-[#e6f0df] px-4 py-2 text-center text-sm font-black uppercase tracking-wide text-slate-950">
          4. Aprobación del cambio
        </div>
        <div className="grid gap-4 border-b border-slate-300 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <p className="text-sm font-semibold text-slate-950">¿El cambio solicitado es aprobado?</p>
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
            placeholder={calidadAprueba === "SI" ? "Registra observaciones de la revisión inicial." : "Indica qué debe corregir el líder de proceso."}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={saveQualityReview}>{calidadAprueba === "SI" ? "Remitir a aprobador" : "Devolver al líder"}</PrimaryButton>
      </div>
    </div>
  );

  const renderAprobacionCambio = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-black text-slate-950">4. APROBACIÓN DEL CAMBIO</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Responsable actual: {registro.responsableActualNombre ?? roleLabels[registro.responsableActual]}.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-300">
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-slate-300 bg-slate-50 text-sm font-black uppercase text-slate-700">
          <div className="border-r border-slate-300 px-4 py-3">¿El cambio solicitado es aprobado?</div>
          <div className="border-r border-slate-300 px-4 py-3">NOMBRE</div>
          <div className="px-4 py-3">CARGO</div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-slate-300 bg-white">
          <div className="border-r border-slate-300 px-4 py-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aprobacion.aprobado === "SI"}
                  onChange={(event) => setAprobacion((current) => ({ ...current, aprobado: event.target.checked ? "SI" : "NO" }))}
                  className="size-4 cursor-pointer"
                />
                <span className="text-sm font-semibold">SI</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aprobacion.aprobado === "NO"}
                  onChange={(event) => setAprobacion((current) => ({ ...current, aprobado: event.target.checked ? "NO" : "SI" }))}
                  className="size-4 cursor-pointer"
                />
                <span className="text-sm font-semibold">NO</span>
              </label>
            </div>
          </div>
          <div className="border-r border-slate-300 px-4 py-4">
            <input value={aprobacion.nombre} onChange={(event) => setAprobacion((current) => ({ ...current, nombre: event.target.value }))} className="h-10 w-full border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="px-4 py-4">
            <input value={aprobacion.cargo} onChange={(event) => setAprobacion((current) => ({ ...current, cargo: event.target.value }))} className="h-10 w-full border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        <div className="border-t border-slate-300 bg-slate-50 px-4 py-3 text-right text-sm font-black uppercase text-slate-700">
          FECHA (dd/mm/aaaa)
        </div>
        <div className="bg-white px-4 py-4">
          <input type="date" value={aprobacion.fecha} onChange={(event) => setAprobacion((current) => ({ ...current, fecha: event.target.value }))} className="h-10 w-32 border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-black uppercase tracking-wide text-slate-600">Observaciones de aprobación</span>
        <textarea value={aprobacion.observaciones} onChange={(event) => setAprobacion((current) => ({ ...current, observaciones: event.target.value }))} className={`${inputClassName} min-h-20`} placeholder="Registra las observaciones de la aprobación o rechazo." />
      </label>

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
        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Fecha de seguimiento</span>
          <input type="date" value={seguimiento.fechaSeguimiento} onChange={(event) => setSeguimiento((current) => ({ ...current, fechaSeguimiento: event.target.value }))} className={inputClassName} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Observaciones</span>
          <textarea value={seguimiento.observaciones} onChange={(event) => setSeguimiento((current) => ({ ...current, observaciones: event.target.value }))} className={`${inputClassName} min-h-16`} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Acciones a tomar</span>
          <textarea value={seguimiento.acciones} onChange={(event) => setSeguimiento((current) => ({ ...current, acciones: event.target.value }))} className={`${inputClassName} min-h-16`} />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Nombre de quien realiza el seguimiento y cierre</span>
          <input value={seguimiento.nombreCierre} onChange={(event) => setSeguimiento((current) => ({ ...current, nombreCierre: event.target.value }))} className={inputClassName} />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Cargo</span>
          <input value={seguimiento.cargoCierre} onChange={(event) => setSeguimiento((current) => ({ ...current, cargoCierre: event.target.value }))} className={inputClassName} />
        </label>
        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Fecha de cierre</span>
          <input type="date" value={seguimiento.fechaCierre} onChange={(event) => setSeguimiento((current) => ({ ...current, fechaCierre: event.target.value }))} className={inputClassName} />
        </label>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={addSeguimiento}
          aria-label="Agregar seguimiento"
          title="Agregar seguimiento"
          className="inline-flex h-12 items-center justify-center gap-3 rounded-md border-2 border-emerald-900 bg-white px-6 text-sm font-bold text-emerald-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        >
          <PlusCircle className="size-5" />
          <span>Agregar seguimiento</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-300">
        <div className="grid min-w-[980px] grid-cols-[0.6fr_1.1fr_1.1fr_1.15fr_0.75fr_0.75fr_0.75fr] bg-emerald-900 text-center text-[11px] font-black uppercase italic text-white">
          <div className="border-r border-white/30 px-3 py-3">¿Eficaz?</div>
          <div className="border-r border-white/30 px-3 py-3">Observaciones</div>
          <div className="border-r border-white/30 px-3 py-3">Acciones</div>
          <div className="border-r border-white/30 px-3 py-3">Responsable cierre</div>
          <div className="border-r border-white/30 px-3 py-3">Cargo</div>
          <div className="border-r border-white/30 px-3 py-3">Seguimiento</div>
          <div className="px-3 py-3">Cierre</div>
        </div>
        <div className="grid min-w-[980px] grid-cols-[0.6fr_1.1fr_1.1fr_1.15fr_0.75fr_0.75fr_0.75fr] bg-slate-50 text-center text-sm text-slate-800">
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.cambioEficaz : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.observaciones : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.acciones : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.nombreCierre : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.cargoCierre : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.fechaSeguimiento : ""}</div>
          <div className="px-3 py-3">{seguimientoAgregado ? seguimiento.fechaCierre : ""}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <PrimaryButton onClick={closeFormat}>Cerrar formato</PrimaryButton>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-950">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <DetailItem label="Código" value={registro.codigo} />
          <DetailItem label="Fecha de creación" value={registro.fecha} />
          <DetailItem label="Empresa" value={registro.empresa} />
          <DetailItem label="Estado actual" value={<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoBadgeClassName[estadoActual]}`}>{estadoLabels[estadoActual]}</span>} />
          <DetailItem label="Responsable actual" value={registro.responsableActualNombre ?? roleLabels[registro.responsableActual]} />
          <DetailItem label="Líder de proceso" value={registro.detalle.liderProceso} />
          <DetailItem label="Proceso" value={registro.detalle.proceso} />
          <DetailItem label="Tipo de cambio" value={registro.tipoCambio} />
          <DetailItem label="Aprobador seleccionado" value={registro.aprobadorSeleccionadoNombre} />
          <DetailItem label="Fecha de aprobación" value={registro.fechaAprobacion} />
          <DetailItem label="Fecha límite de cierre" value={registro.fechaLimiteCierre} />
          <DetailItem label="Días restantes" value={diasRestantes === null ? "" : diasRestantes} />
          <DetailItem label="Estado del cierre" value={getEstadoCierre(registro)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Análisis asociados al cambio</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {analisisFields.map((field) => (
            <DetailItem key={field.id} label={field.label} value={registro.detalle.analisis[field.id]} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Plan para implementación</h3>
        {registro.detalle.plan.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <div className="grid grid-cols-[1.4fr_1fr_9rem] border-y border-slate-200 bg-[#f4f7fb] text-[11px] font-black uppercase tracking-wide text-slate-600">
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
      </section>

      {showApprovalActions ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <FilePenLine className="mt-1 size-5 text-emerald-800" />
            <div className="w-full space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-950">Acciones del flujo</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Solo se habilitan las acciones correspondientes al responsable actual.</p>
              </div>

              {isQualityReview ? renderRevisionCalidad() : null}

              {canReenterQuality ? (
                <div className="space-y-4">
                  <DetailItem label={registro.estado === "RECHAZADO_APROBADOR" ? "Observaciones del aprobador" : "Observaciones de Calidad"} value={registro.aprobacion?.observaciones ?? registro.observacionesCorreccion} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={onEdit} className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800">
                      Editar formato
                    </button>
                    <PrimaryButton onClick={() => onWorkflowAction?.("REENVIAR_CALIDAD")}>{registro.estado === "CREADO" ? "Enviar a Calidad" : "Reenviar a Calidad"}</PrimaryButton>
                  </div>
                </div>
              ) : null}

              {isApproverTurn ? renderAprobacionCambio() : null}
              {isQualityFollowup ? renderSeguimientoCambio() : null}
              {registro.estado === "CERRADO" ? <p className="text-sm font-bold text-emerald-700">El formato ya fue cerrado.</p> : null}
              {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Línea de tiempo del registro</h3>
        <div className="mt-4 space-y-3">
          {registro.historial.length > 0 ? (
            [...registro.historial].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map((evento, index) => (
              <div key={`${evento.fecha}-${evento.accion}`} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">{index + 1}. {actionLabels[evento.accion]}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {evento.usuario} {evento.rol ? `- ${roleLabels[evento.rol]}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-black uppercase text-slate-500">{formatTimelineDate(evento.fecha)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  {evento.estadoAnterior ? (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoBadgeClassName[evento.estadoAnterior]}`}>
                      {estadoLabels[evento.estadoAnterior]}
                    </span>
                  ) : null}
                  {evento.estadoAnterior && evento.estadoNuevo ? <span className="font-black text-slate-400">→</span> : null}
                  {evento.estadoNuevo ? (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoBadgeClassName[evento.estadoNuevo]}`}>
                      {estadoLabels[evento.estadoNuevo]}
                    </span>
                  ) : null}
                </div>
                {evento.observaciones ? <p className="mt-1 text-sm leading-6 text-slate-600">{evento.observaciones}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Sin movimientos registrados.</p>
          )}
        </div>
      </section>
    </div>
  );
}
