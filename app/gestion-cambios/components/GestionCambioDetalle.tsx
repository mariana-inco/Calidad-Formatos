import { CalendarDays, UserCheck, Workflow } from "lucide-react";
import { analisisFields } from "./formData";
import type { GestionCambio, GestionCambioWorkflowAction } from "./types";

type GestionCambioDetalleProps = {
  registro: GestionCambio;
  showApprovalActions?: boolean;
  onWorkflowAction?: (action: GestionCambioWorkflowAction) => void;
};

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

const workflowDecisionByStatus: Partial<
  Record<
    GestionCambio["estado"],
    {
      title: string;
      description: string;
      actions: {
        label: string;
        action: GestionCambioWorkflowAction;
        className: string;
      }[];
    }
  >
> = {
  "En revisión": {
    title: "Validación de Calidad",
    description: "Revisa si el cambio está correctamente documentado. Si no cumple, se devuelve para corrección.",
    actions: [
      {
        label: "Solicitar corrección",
        action: "solicitar-correccion",
        className: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
      },
      {
        label: "Validar y remitir",
        action: "validar-remitir",
        className: "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900",
      },
    ],
  },
  "Pendiente firma": {
    title: "Firma de Gerencia Administrativa",
    description: "El cambio ya fue validado por Calidad y queda pendiente de firma por Gerencia Administrativa.",
    actions: [
      {
        label: "Registrar firma",
        action: "registrar-firma",
        className: "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900",
      },
    ],
  },
  "En seguimiento": {
    title: "Seguimiento de implementación",
    description: "Calidad realiza seguimiento a la eficacia de la implementación y puede cerrar el formato.",
    actions: [
      {
        label: "Cerrar formato",
        action: "cerrar-formato",
        className: "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900",
      },
    ],
  },
};

function getWorkflowMessage(registro: GestionCambio) {
  if (registro.estado === "Requiere corrección") {
    return "El líder del proceso debe corregir el formato con base en las observaciones.";
  }

  if (registro.estado === "Cerrado") {
    return "El formato ya fue cerrado por Calidad.";
  }

  return "No hay acciones pendientes para esta etapa.";
}

export function GestionCambioDetalle({ registro, showApprovalActions = false, onWorkflowAction }: GestionCambioDetalleProps) {
  const workflowDecision = workflowDecisionByStatus[registro.estado];

  return (
    <div className="space-y-6 text-slate-950">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <DetailItem label="Código" value={registro.codigo} />
          <DetailItem label="Fecha" value={registro.fecha} />
          <DetailItem label="Empresa" value={registro.empresa} />
          <DetailItem label="Estado" value={registro.estado} />
          <DetailItem label="Líder de proceso" value={registro.detalle.liderProceso} />
          <DetailItem label="Proceso" value={registro.detalle.proceso} />
          <DetailItem label="Aprobador asignado" value={registro.aprobador} />
          <DetailItem label="Aprobación" value={registro.aprobacion ?? "Pendiente"} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-black text-slate-950">Tipos de cambio registrados</h3>
        {registro.detalle.tiposCambio.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {registro.detalle.tiposCambio.map((tipoCambio) => (
              <div key={tipoCambio} className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
                {tipoCambio}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No se agregaron tipos de cambio.</p>
        )}
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
              <div className="px-4 py-3">
                <TableHeadLabel icon={<Workflow className="size-3.5" />}>Actividades</TableHeadLabel>
              </div>
              <div className="border-l border-slate-200 px-4 py-3">
                <TableHeadLabel icon={<UserCheck className="size-3.5" />}>Responsable</TableHeadLabel>
              </div>
              <div className="border-l border-slate-200 px-4 py-3">
                <TableHeadLabel icon={<CalendarDays className="size-3.5" />}>Fecha</TableHeadLabel>
              </div>
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-black text-slate-950">{workflowDecision?.title ?? "Decisión de aprobación"}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{workflowDecision?.description ?? getWorkflowMessage(registro)}</p>
            </div>
            {workflowDecision ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                {workflowDecision.actions.map((item) => (
                  <button
                    key={item.action}
                    type="button"
                    onClick={() => onWorkflowAction?.(item.action)}
                    className={`inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-bold transition ${item.className}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
