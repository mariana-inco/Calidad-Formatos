"use client";

import { CalendarDays, Download, FilePenLine, UserCheck, Workflow } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { analisisFields } from "./formData";
import { SignaturePad } from "./SignaturePad";
import type { AprobacionCambioData, GestionCambio, GestionCambioWorkflowAction, SeguimientoCambioData, UsuarioGestionCambio } from "./types";
import {
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
  firmaRevisionCalidad?: string;
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

const companyHeaders: Record<GestionCambio["empresa"], { logo: string; nombre: string; nit: string }> = {
  Dromos: { logo: "DR", nombre: "Dromos", nit: "Config local ROCA pendiente" },
  Incominería: { logo: "IN", nombre: "Incominería", nit: "Config local ROCA pendiente" },
  Ingestrac: { logo: "IG", nombre: "Ingestrac", nit: "Config local ROCA pendiente" },
  Drominc: { logo: "DM", nombre: "Drominc", nit: "Config local ROCA pendiente" },
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
  responsablesAprobacion = [],
  onEdit,
  onWorkflowAction,
}: GestionCambioDetalleProps) {
  const [calidadAprueba, setCalidadAprueba] = useState<"SI" | "NO">("SI");
  const [observacionesCorreccion, setObservacionesCorreccion] = useState(registro.observacionesCorreccion ?? "");
  const [firmaRevisionCalidad, setFirmaRevisionCalidad] = useState(
    registro.aprobaciones?.find((item) => item.rolAprobador === "GESTION_CALIDAD")?.firma ?? "",
  );
  const [aprobacion, setAprobacion] = useState<AprobacionCambioData>(
    registro.aprobacion ?? {
      aprobado: "SI",
      nombre: usuarioActual?.nombre ?? "",
      cargo: usuarioActual?.cargo ?? roleLabels[usuarioActual?.rol ?? "GERENCIA_ADMINISTRATIVA"],
      fecha: "",
      observaciones: "",
      firma: "",
      rolAprobador: usuarioActual?.rol ?? "GERENCIA_ADMINISTRATIVA",
    },
  );
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

  const isQualityReview = registro.estado === "EN_REVISION_CALIDAD" && usuarioActual?.rol === "GESTION_CALIDAD" && !hasQualityInitialReview(registro);
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
    if (!requireText(aprobadorSeleccionadoId, "Seleccione a quién enviar para aprobación.")) return;
    if (!requireText(firmaRevisionCalidad, "La firma de la revisión de Calidad es obligatoria.")) return;

    const aprobador = responsablesAprobacion.find((responsable) => responsable.id === aprobadorSeleccionadoId);

    setError("");
    onWorkflowAction?.("VALIDAR_REMITIR", {
      aprobadorSeleccionadoId,
      firmaRevisionCalidad,
      validacionCalidad: observacionesCorreccion.trim()
        ? `Calidad aprueba la revisión inicial y remite a ${aprobador?.nombre ?? "el aprobador seleccionado"}. Observaciones: ${observacionesCorreccion.trim()}`
        : `Calidad aprueba la revisión inicial y remite a ${aprobador?.nombre ?? "el aprobador seleccionado"}.`,
    });
  };

  const registerApprovalDecision = () => {
    if (!requireText(aprobacion.observaciones, "Las observaciones de aprobación son obligatorias.")) return;
    if (!requireText(aprobacion.firma ?? "", "La firma del aprobador es obligatoria.")) return;
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
      setError("Selecciona si el cambio fue eficaz.");
      return false;
    }
    if (seguimiento.cambioEficaz === "NO" && !requireText(seguimiento.observaciones, "Las observaciones del seguimiento son obligatorias cuando el cambio no fue eficaz.")) return false;
    if (!requireText(seguimiento.acciones, "Las acciones del seguimiento son obligatorias.")) return false;
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

  const exportPdf = () => {
    const header = companyHeaders[registro.empresa];
    const rows = registro.historial
      .map(
        (evento, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${actionLabels[evento.accion]}</td>
            <td>${evento.estadoAnterior ? estadoLabels[evento.estadoAnterior] : ""}</td>
            <td>${evento.estadoNuevo ? estadoLabels[evento.estadoNuevo] : ""}</td>
            <td>${evento.usuario}${evento.cargo ? ` - ${evento.cargo}` : ""}</td>
            <td>${formatTimelineDate(evento.fecha)}</td>
            <td>${evento.observaciones ?? ""}${evento.aprobadorSeleccionadoNombre ? ` Aprobador: ${evento.aprobadorSeleccionadoNombre}` : ""}</td>
          </tr>`,
      )
      .join("");
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>${registro.codigo} - SIG-F006</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 28px; }
            header { display: grid; grid-template-columns: 86px 1fr 180px; gap: 14px; align-items: center; border: 1px solid #94a3b8; padding: 12px; }
            .logo { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 8px; background: #064e3b; color: white; font-weight: 800; font-size: 24px; }
            h1 { margin: 0; font-size: 18px; text-align: center; }
            h2 { margin: 24px 0 8px; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
            .meta { font-size: 12px; line-height: 1.5; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .box { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; min-height: 32px; }
            .label { display: block; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: top; }
            th { background: #ecfdf5; text-transform: uppercase; font-size: 10px; }
            @media print { button { display: none; } body { margin: 14mm; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Imprimir / guardar PDF</button>
          <header>
            <div class="logo">${header.logo}</div>
            <div>
              <h1>GESTIÓN DEL CAMBIO SIG-F006</h1>
              <p class="meta">${header.nombre} | ${header.nit}</p>
            </div>
            <div class="meta"><strong>Código:</strong> ${registro.codigo}<br/><strong>Estado:</strong> ${estadoLabels[getEffectiveEstado(registro)]}</div>
          </header>
          <h2>Datos generales</h2>
          <div class="grid">
            <div class="box"><span class="label">Empresa</span>${registro.empresa}</div>
            <div class="box"><span class="label">Proceso</span>${registro.proceso}</div>
            <div class="box"><span class="label">Creador</span>${registro.creadorNombre ?? registro.creadorId}</div>
            <div class="box"><span class="label">Líder del proceso</span>${registro.liderProceso}</div>
            <div class="box"><span class="label">Tipo de cambio</span>${registro.tipoCambio}</div>
            <div class="box"><span class="label">Responsable actual</span>${registro.responsableActualNombre ?? roleLabels[registro.responsableActual]}</div>
          </div>
          <h2>Análisis asociado al cambio</h2>
          <div class="grid">${analisisFields.map((field) => `<div class="box"><span class="label">${field.label}</span>${registro.detalle.analisis[field.id] ?? ""}</div>`).join("")}</div>
          <h2>Plan de implementación</h2>
          <table><thead><tr><th>Actividad</th><th>Responsable</th><th>Fecha oficial</th></tr></thead><tbody>${registro.detalle.plan
            .map((plan) => `<tr><td>${plan.actividades}</td><td>${plan.responsable}</td><td>${plan.fecha}</td></tr>`)
            .join("")}</tbody></table>
          <h2>Validación, aprobación y seguimiento</h2>
          <div class="grid">
            <div class="box"><span class="label">Validación de Calidad</span>${registro.validacionCalidad ?? ""}</div>
            ${(registro.aprobaciones ?? [])
              .map(
                (item) =>
                  `<div class="box"><span class="label">${roleLabels[item.rolAprobador]} - ${item.aprobado === "SI" ? "Conforme" : "Rechazado"}</span>${item.nombre} - ${item.cargo}<br/>${item.observaciones}${item.firma ? `<br/><img src="${item.firma}" alt="Firma de ${item.nombre}" style="max-width:220px;max-height:70px;margin-top:8px" />` : ""}</div>`,
              )
              .join("")}
            <div class="box"><span class="label">Seguimiento de eficacia</span>${registro.seguimiento ? `${registro.seguimiento.cambioEficaz} - ${registro.seguimiento.observaciones} ${registro.seguimiento.acciones}` : ""}</div>
            <div class="box"><span class="label">Estado final / fecha cierre</span>${estadoLabels[getEffectiveEstado(registro)]} ${registro.fechaCierre ?? ""}</div>
          </div>
          <h2>Historial de trazabilidad</h2>
          <table><thead><tr><th>#</th><th>Acción</th><th>De</th><th>A</th><th>Usuario</th><th>Fecha/hora oficial</th><th>Observación</th></tr></thead><tbody>${rows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
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
            <SignaturePad
              value={firmaRevisionCalidad}
              label="Firma de revisión de Calidad"
              onChange={setFirmaRevisionCalidad}
            />
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

      <SignaturePad
        value={aprobacion.firma}
        label={isLeaderApprovalTurn ? "Firma del líder del proceso" : "Firma del aprobador"}
        onChange={(firma) => setAprobacion((current) => ({ ...current, firma }))}
      />

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
    <div className="space-y-6 text-slate-950">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          <Download className="size-4" />
          Exportar PDF
        </button>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <DetailItem label="Código" value={registro.codigo} />
          <DetailItem label="Fecha de creación" value={registro.fecha} />
          <DetailItem label="Empresa" value={registro.empresa} />
          <DetailItem label="Estado actual" value={<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoBadgeClassName[estadoActual]}`}>{estadoLabels[estadoActual]}</span>} />
          <DetailItem label="Responsable actual" value={registro.responsableActualNombre ?? roleLabels[registro.responsableActual]} />
          <DetailItem label="Creador" value={registro.creadorNombre ?? registro.creadorId} />
          <DetailItem label="Líder de proceso" value={registro.liderProceso} />
          <DetailItem label="Proceso" value={registro.detalle.proceso} />
          <DetailItem label="Tipo de cambio" value={registro.tipoCambio} />
          <DetailItem label="Aprobador seleccionado" value={registro.aprobadorSeleccionadoNombre} />
          <DetailItem label="Fecha de aprobación" value={registro.fechaAprobacion} />
          <DetailItem label="Fecha límite de cierre" value={registro.fechaLimiteCierre} />
          <DetailItem label="Días restantes" value={diasRestantes === null ? "" : diasRestantes} />
          <DetailItem label="Estado del cierre" value={getEstadoCierre(registro)} />
        </div>
      </section>

      {(registro.aprobaciones ?? []).some((item) => item.firma) ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-black text-slate-950">Firmas y revisiones registradas</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(registro.aprobaciones ?? [])
              .filter((item) => item.firma)
              .map((item, index) => (
                <div key={`${item.rolAprobador}-${item.nombre}-${item.fecha}-${index}`} className="border-l-4 border-emerald-700 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-emerald-800">{roleLabels[item.rolAprobador]}</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{item.nombre}</p>
                  <p className="text-xs font-semibold text-slate-500">{item.cargo} · {item.fecha}</p>
                  <Image
                    src={item.firma!}
                    alt={`Firma de ${item.nombre}`}
                    width={420}
                    height={120}
                    unoptimized
                    className="mt-3 h-20 w-full object-contain object-left"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.observaciones}</p>
                </div>
              ))}
          </div>
        </section>
      ) : null}

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
              {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div> : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Línea de tiempo del registro</h3>
        <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
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
      </section>
    </div>
  );
}
