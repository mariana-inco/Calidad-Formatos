"use client";

import { ClipboardCheck, ShieldAlert } from "lucide-react";
import type { GestionCambio, UsuarioGestionCambio } from "./types";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import {
  canAccessApproval,
  canEditCorrection,
  filterRegistrosForApproval,
  filterRegistrosForApprovalHistory,
  getDiasRestantes,
  getEffectiveEstado,
  hasApproverDecision,
  hasQualityInitialReview,
  roleLabels,
} from "./workflow";

type AprobacionGestionCambiosViewProps = {
  registros: GestionCambio[];
  usuarioActual?: UsuarioGestionCambio;
  onView: (registro: GestionCambio) => void;
  onEdit: (registro: GestionCambio) => void;
};

function ApprovalSection({
  title,
  description,
  registros,
  usuarioActual,
  onView,
  onEdit,
}: {
  title: string;
  description: string;
  registros: GestionCambio[];
  usuarioActual?: UsuarioGestionCambio;
  onView: (registro: GestionCambio) => void;
  onEdit: (registro: GestionCambio) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-black uppercase text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <HistorialGestionCambiosTable
        registros={registros}
        emptyTitle="No hay registros en esta bandeja"
        emptyDescription="Cuando el flujo asigne registros a esta etapa, aparecerán aquí."
        canEdit={(registro) => canEditCorrection(registro, usuarioActual)}
        onView={onView}
        onEdit={onEdit}
      />
    </section>
  );
}

export function AprobacionGestionCambiosView({ registros, usuarioActual, onView, onEdit }: AprobacionGestionCambiosViewProps) {
  if (!canAccessApproval(usuarioActual)) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 size-5 shrink-0" />
          <div>
            <h1 className="text-lg font-black">Aprobación no disponible para este usuario</h1>
            <p className="mt-1 text-sm leading-6">
              Esta pestaña solo está visible para usuarios activos configurados como Calidad, líderes o aprobadores.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const registrosAsignados = filterRegistrosForApproval(registros, usuarioActual);
  const registrosHistorial = filterRegistrosForApprovalHistory(registros, usuarioActual);

  const pendientesRevision = registrosAsignados.filter((registro) => registro.estado === "EN_REVISION_CALIDAD" && !hasQualityInitialReview(registro));
  const devueltos = registros.filter(
    (registro) =>
      usuarioActual?.rol === "GESTION_CALIDAD" &&
      registro.empresa === usuarioActual.empresa &&
      (registro.estado === "DEVUELTO_LIDER" || registro.estado === "RECHAZADO_APROBADOR"),
  );
  const seguimiento = registrosAsignados.filter((registro) => registro.estado === "EN_SEGUIMIENTO_CALIDAD");
  const proximos = seguimiento.filter((registro) => {
    if (getEffectiveEstado(registro) === "VENCIDO") return true;
    const dias = getDiasRestantes(registro.fechaLimiteCierre);
    return dias !== null && dias <= 15;
  });
  const pendientesAprobar = registrosAsignados.filter((registro) => registro.estado === "PENDIENTE_APROBACION" && !hasApproverDecision(registro, usuarioActual));

  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-800">
            <ClipboardCheck className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-950 sm:text-3xl">Aprobación de Gestión de Cambios</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Usuario activo: <span className="font-bold text-slate-950">{usuarioActual?.nombre}</span> - {usuarioActual ? roleLabels[usuarioActual.rol] : ""}
            </p>
          </div>
        </div>
      </section>

      {usuarioActual?.rol === "GESTION_CALIDAD" ? (
        <>
          <ApprovalSection title="Pendientes de revisión inicial" description="Registros asignados a Calidad para validar documentación." registros={pendientesRevision} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection title="Devueltos o pendientes de ajuste" description="Registros que están en manos del líder o fueron rechazados por el aprobador." registros={devueltos} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection title="Aprobados pendientes de seguimiento" description="Registros que ya aprobaron y deben cerrarse por Gestión de Calidad." registros={seguimiento} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection title="Próximos a vencer" description="Registros con fecha límite de cierre vencida o dentro de los próximos 15 días." registros={proximos} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection
            title="Historial de registros gestionados"
            description="Todos los registros que revisaste, devolviste, remitiste o cerraste permanecen aquí con su estado y trazabilidad completa."
            registros={registrosHistorial}
            usuarioActual={usuarioActual}
            onView={onView}
            onEdit={onEdit}
          />
        </>
      ) : usuarioActual?.rol === "GERENCIA_ADMINISTRATIVA" || usuarioActual?.rol === "APROBADOR_ADICIONAL" ? (
        <>
          <ApprovalSection title="Pendientes por aprobar" description="Registros asignados a tu usuario o rol aprobador." registros={pendientesAprobar} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
          <ApprovalSection title="Historial de aprobaciones realizadas" description="Registros que ya aprobaste o rechazaste." registros={registrosHistorial} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
        </>
      ) : (
        <ApprovalSection title="Pendientes de ajuste" description="Registros devueltos al líder de proceso para corrección." registros={registrosAsignados} usuarioActual={usuarioActual} onView={onView} onEdit={onEdit} />
      )}
    </div>
  );
}
