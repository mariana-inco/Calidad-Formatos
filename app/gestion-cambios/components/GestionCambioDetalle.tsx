"use client";

import { CalendarDays, FilePenLine, PlusCircle, UserCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { analisisFields } from "./formData";
import type { GestionCambio, GestionCambioWorkflowAction, SeguimientoCambioData, UsuarioGestionCambio } from "./types";
import { canEditCorrection, estadoBadgeClassName, estadoLabels, roleLabels } from "./workflow";

export type WorkflowPayload = {
  observacionesCorreccion?: string;
  validacionCalidad?: string;
  firmaGerencia?: string;
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
  const [firmaGerencia, setFirmaGerencia] = useState(usuarioActual?.nombre ?? "");
  const [seguimiento, setSeguimiento] = useState<SeguimientoCambioData>(
    registro.seguimiento ?? {
      cambioEficaz: "",
      observaciones: "",
      acciones: "",
      nombreCierre: usuarioActual?.nombre ?? "",
      cargoCierre: roleLabels[usuarioActual?.rol ?? "GESTION_CALIDAD"],
      fechaCierre: new Date().toISOString().slice(0, 10),
    },
  );
  const [seguimientoAgregado, setSeguimientoAgregado] = useState(Boolean(registro.seguimiento));
  const [error, setError] = useState("");
  const isQualityApproval = registro.estado === "EN_REVISION" && usuarioActual?.rol === "GESTION_CALIDAD";

  const requireText = (value: string, message: string) => {
    if (value.trim()) return true;
    setError(message);
    return false;
  };

  const registerSignature = () => {
    if (!requireText(firmaGerencia, "El nombre de quien firma es obligatorio.")) return;
    setError("");
    onWorkflowAction?.("REGISTRAR_FIRMA", { firmaGerencia });
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
    if (!requireText(seguimiento.fechaCierre, "La fecha de cierre es obligatoria.")) return false;
    setError("");
    return true;
  };

  const addSeguimiento = () => {
    if (!validateSeguimiento()) return;
    setSeguimientoAgregado(true);
  };

  const approveWithSeguimiento = () => {
    if (!validateSeguimiento()) return;
    onWorkflowAction?.("VALIDAR_REMITIR", {
      validacionCalidad: seguimiento.cambioEficaz === "SI" ? "Cambio eficaz" : seguimiento.observaciones,
      seguimiento,
    });
  };

  const closeFormat = () => {
    if (!validateSeguimiento()) return;
    setError("");
    onWorkflowAction?.("CERRAR_FORMATO", { seguimiento });
  };

  const renderSeguimientoCambio = (mode: "approve" | "close") => (
    <div className="space-y-5">
      <div className="flex justify-center">
        <span className="inline-flex rounded-md border border-emerald-900 bg-white px-4 py-2 text-xs font-black uppercase text-emerald-950 shadow-md">
          4. Seguimiento al cambio
        </span>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">¿El cambio fue eficaz?</span>
          <select
            value={seguimiento.cambioEficaz}
            onChange={(event) =>
              setSeguimiento((current) => {
                const cambioEficaz = event.target.value as SeguimientoCambioData["cambioEficaz"];
                return {
                  ...current,
                  cambioEficaz,
                  observaciones: cambioEficaz === "SI" ? "" : current.observaciones,
                };
              })
            }
            className={inputClassName}
          >
            <option value="">Seleccione una opción</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </label>

        {seguimiento.cambioEficaz === "NO" ? (
          <label className="block">
            <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">
              Observaciones <span className="normal-case">(Definir las causas o fallas que afectaron su implementación)</span>
            </span>
            <textarea
              value={seguimiento.observaciones}
              onChange={(event) => setSeguimiento((current) => ({ ...current, observaciones: event.target.value }))}
              className={`${inputClassName} min-h-16`}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">
            Acciones <span className="normal-case">(Definir las acciones a tomar para implementar el cambio según las causas o fallas detectadas)</span>
          </span>
          <textarea
            value={seguimiento.acciones}
            onChange={(event) => setSeguimiento((current) => ({ ...current, acciones: event.target.value }))}
            className={`${inputClassName} min-h-16`}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Nombre de quien realiza el seguimiento y cierre</span>
          <input
            value={seguimiento.nombreCierre}
            onChange={(event) => setSeguimiento((current) => ({ ...current, nombreCierre: event.target.value }))}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Cargo</span>
          <input
            value={seguimiento.cargoCierre}
            onChange={(event) => setSeguimiento((current) => ({ ...current, cargoCierre: event.target.value }))}
            className={inputClassName}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase italic tracking-wide text-slate-950">Fecha</span>
          <input
            type="date"
            value={seguimiento.fechaCierre}
            onChange={(event) => setSeguimiento((current) => ({ ...current, fechaCierre: event.target.value }))}
            className={inputClassName}
          />
        </label>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={addSeguimiento}
          aria-label="Agregar seguimiento"
          title="Agregar seguimiento"
          className="inline-grid size-12 place-items-center rounded-md border-2 border-blue-900 bg-emerald-50 text-emerald-700 shadow-sm transition hover:bg-emerald-100"
        >
          <PlusCircle className="size-8" />
        </button>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-300">
        <div className="grid min-w-[900px] grid-cols-[0.7fr_1.25fr_1.25fr_1.25fr_0.85fr_0.7fr] bg-emerald-900 text-center text-[11px] font-black uppercase italic text-white">
          <div className="border-r border-white/30 px-3 py-3">¿El cambio fue eficaz?</div>
          <div className="border-r border-white/30 px-3 py-3">Observaciones</div>
          <div className="border-r border-white/30 px-3 py-3">Acciones</div>
          <div className="border-r border-white/30 px-3 py-3">Nombre de quien realiza el seguimiento y cierre</div>
          <div className="border-r border-white/30 px-3 py-3">Cargo</div>
          <div className="px-3 py-3">Fecha</div>
        </div>
        <div className="grid min-w-[900px] grid-cols-[0.7fr_1.25fr_1.25fr_1.25fr_0.85fr_0.7fr] bg-slate-50 text-center text-sm text-slate-800">
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.cambioEficaz : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.observaciones : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.acciones : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.nombreCierre : ""}</div>
          <div className="border-r border-slate-300 px-3 py-3">{seguimientoAgregado ? seguimiento.cargoCierre : ""}</div>
          <div className="px-3 py-3">{seguimientoAgregado ? seguimiento.fechaCierre : ""}</div>
        </div>
      </div>

      <div className="flex justify-end">
        {mode === "approve" ? <PrimaryButton onClick={approveWithSeguimiento}>Guardar seguimiento y aprobar</PrimaryButton> : <PrimaryButton onClick={closeFormat}>Cerrar formato</PrimaryButton>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-950">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <DetailItem label="Código" value={registro.codigo} />
          <DetailItem label="Fecha" value={registro.fecha} />
          <DetailItem label="Empresa" value={registro.empresa} />
          <DetailItem label="Estado" value={<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${estadoBadgeClassName[registro.estado]}`}>{estadoLabels[registro.estado]}</span>} />
          <DetailItem label="Responsable actual" value={roleLabels[registro.responsableActual]} />
          <DetailItem label="Líder de proceso" value={registro.detalle.liderProceso} />
          <DetailItem label="Proceso" value={registro.detalle.proceso} />
          <DetailItem label="Tipo de cambio" value={registro.tipoCambio} />
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
          {isQualityApproval ? (
            renderSeguimientoCambio("approve")
          ) : (
            <div className="flex items-start gap-3">
              <FilePenLine className="mt-1 size-5 text-emerald-800" />
              <div className="w-full space-y-5">
                <div>
                  <h3 className="text-base font-black text-slate-950">Acciones del flujo</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Solo se habilitan las acciones correspondientes al responsable actual.</p>
                </div>

                {registro.estado === "EN_REVISION" && usuarioActual?.rol === "GESTION_CALIDAD" ? renderSeguimientoCambio("approve") : null}

                {registro.estado === "REQUIERE_CORRECCION" && canEditCorrection(registro, usuarioActual) ? (
                  <div className="space-y-4">
                    <DetailItem label="Observaciones de Calidad" value={registro.observacionesCorreccion} />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={onEdit} className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-emerald-700 hover:text-emerald-800">
                        Editar formato
                      </button>
                      <PrimaryButton onClick={() => onWorkflowAction?.("REENVIAR_CALIDAD")}>Reenviar a Calidad</PrimaryButton>
                    </div>
                  </div>
                ) : null}

                {registro.estado === "PENDIENTE_FIRMA" && usuarioActual?.rol === "GERENCIA_ADMINISTRATIVA" ? (
                  <div className="space-y-4">
                    <label className="block max-w-xl">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Nombre de quien registra firma</span>
                      <input value={firmaGerencia} onChange={(event) => setFirmaGerencia(event.target.value)} className={inputClassName} />
                    </label>
                    <PrimaryButton onClick={registerSignature}>Registrar firma</PrimaryButton>
                  </div>
                ) : null}

                {registro.estado === "EN_SEGUIMIENTO" && usuarioActual?.rol === "GESTION_CALIDAD" ? renderSeguimientoCambio("close") : null}

                {registro.estado === "CERRADO" ? <p className="text-sm font-bold text-emerald-700">El formato ya fue cerrado.</p> : null}
                {error ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div> : null}
              </div>
            </div>
          )}
          {isQualityApproval && error ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div> : null}
        </section>
      ) : null}
    </div>
  );
}
