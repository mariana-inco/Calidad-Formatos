"use client";

import { CheckCircle2, ClipboardCheck, Clock3, FilePenLine, Plus, RotateCw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AprobacionGestionCambiosView } from "./AprobacionGestionCambiosView";
import { ConfiguracionRolesView } from "./ConfiguracionRolesView";
import { GestionCambioDetalle, type WorkflowPayload } from "./GestionCambioDetalle";
import { GestionCambioModal } from "./GestionCambioModal";
import { SolicitudCambioForm } from "./GestionCambiosForm";
import { GestionCambiosTabs, type GestionCambiosTab } from "./GestionCambiosTabs";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import type { GestionCambio, GestionCambioEmpresa, GestionCambioWorkflowAction, SolicitudCambioData, UsuarioGestionCambio } from "./types";
import { filterRegistrosForCreation, roleLabels } from "./workflow";

const FORM_ID = "solicitud-cambio-form";
const empresaActiva: GestionCambioEmpresa = "Incominería";

type ModalMode = "create" | "view" | "edit";
type SolicitudSubmitIntent = "draft" | "send-quality";

async function apiRequest<T>(body?: unknown): Promise<T> {
  const response = await fetch("/api/gestion-cambios", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No fue posible completar la operación.");
  return result as T;
}

export function GestionCambiosPage() {
  const [registros, setRegistros] = useState<GestionCambio[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioGestionCambio[]>([]);
  const [usuarioActualId, setUsuarioActualId] = useState("");
  const [activeTab, setActiveTab] = useState<GestionCambiosTab>("creacion");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedRegistro, setSelectedRegistro] = useState<GestionCambio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    apiRequest<{ usuarios: UsuarioGestionCambio[]; registros: GestionCambio[] }>()
      .then((data) => {
        setUsuarios(data.usuarios);
        setRegistros(data.registros);
        setUsuarioActualId((current) => current || data.usuarios[0]?.id || "");
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "No fue posible cargar la información."))
      .finally(() => setIsLoading(false));
  }, []);

  const usuarioActual = useMemo(
    () => usuarios.find((usuario) => usuario.id === usuarioActualId && usuario.activo),
    [usuarioActualId, usuarios],
  );

  const registrosEmpresa = useMemo(() => registros.filter((registro) => registro.empresa === empresaActiva), [registros]);
  const registrosCreacion = useMemo(() => filterRegistrosForCreation(registrosEmpresa, usuarioActual), [registrosEmpresa, usuarioActual]);
  const resumen = useMemo(
    () => ({
      total: registrosEmpresa.length,
      aprobados: registrosEmpresa.filter((registro) => registro.estado === "APROBADO" || registro.estado === "CERRADO").length,
      enProceso: registrosEmpresa.filter((registro) => registro.estado === "EN_REVISION_CALIDAD" || registro.estado === "EN_SEGUIMIENTO_CALIDAD").length,
      pendientes: registrosEmpresa.filter((registro) => registro.estado === "PENDIENTE_APROBACION" || registro.estado === "PENDIENTE_APROBACION_LIDER").length,
      rechazados: registrosEmpresa.filter((registro) => registro.estado === "RECHAZADO_LIDER" || registro.estado === "RECHAZADO_APROBADOR").length,
    }),
    [registrosEmpresa],
  );

  const openCreateModal = () => {
    setSelectedRegistro(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openViewModal = (registro: GestionCambio) => {
    setSelectedRegistro(registro);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEditModal = (registro: GestionCambio) => {
    setSelectedRegistro(registro);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRegistro(null);
  };

  const saveSolicitud = async (data: SolicitudCambioData, intent: SolicitudSubmitIntent) => {
    if (!usuarioActual) return;
    setIsSaving(true);
    setError("");
    try {
      const result = await apiRequest<{ registro: GestionCambio }>({
        operation: modalMode === "edit" && selectedRegistro ? "update-change" : "create-change",
        id: selectedRegistro?.id,
        userId: usuarioActual.id,
        data,
        intent,
      });
      setRegistros((items) =>
        modalMode === "edit"
          ? items.map((item) => (item.id === result.registro.id ? result.registro : item))
          : [result.registro, ...items],
      );
      closeModal();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible guardar el registro.");
    } finally {
      setIsSaving(false);
    }
  };

  const addUsuario = async (usuario: UsuarioGestionCambio) => {
    setError("");
    try {
      const result = await apiRequest<{ usuario: UsuarioGestionCambio }>({
        operation: "create-user",
        usuario,
      });
      setUsuarios((items) => [...items, result.usuario]);
      setUsuarioActualId((current) => current || result.usuario.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible crear el usuario.");
    }
  };

  const deleteUsuario = async (usuarioId: string) => {
    setError("");
    try {
      await apiRequest({ operation: "deactivate-user", id: usuarioId });
      if (usuarioActualId === usuarioId) {
        setUsuarioActualId(usuarios.find((usuario) => usuario.id !== usuarioId && usuario.activo)?.id ?? "");
      }
      setUsuarios((items) => items.filter((item) => item.id !== usuarioId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible desactivar el usuario.");
    }
  };

  const actualizarFlujoAprobacion = async (registro: GestionCambio, action: GestionCambioWorkflowAction, payload?: WorkflowPayload) => {
    if (!usuarioActual) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ registro: GestionCambio }>({
        operation: "workflow",
        id: registro.id,
        userId: usuarioActual.id,
        action,
        payload,
      });
      setRegistros((items) => items.map((item) => (item.id === result.registro.id ? result.registro : item)));
      try {
        const freshData = await apiRequest<{ usuarios: UsuarioGestionCambio[]; registros: GestionCambio[] }>();
        setRegistros(freshData.registros);
        setUsuarios(freshData.usuarios);
      } catch {
        // La respuesta de la mutación ya contiene el estado confirmado por la base.
      }
      const workflowNotices: Partial<Record<GestionCambioWorkflowAction, string>> = {
        APROBAR_LIDER: `${result.registro.codigo} fue aprobado por el líder y enviado a revisión de Calidad.`,
        RECHAZAR_LIDER: `${result.registro.codigo} fue rechazado por el líder y devuelto al creador.`,
        VALIDAR_REMITIR: `Revisión finalizada. ${result.registro.codigo} quedó pendiente de aprobación por ${result.registro.responsableActualNombre ?? "el responsable seleccionado"}.`,
        SOLICITAR_CORRECCION: `${result.registro.codigo} fue devuelto para ajustes.`,
        REGISTRAR_APROBACION: `${result.registro.codigo} fue aprobado y retornó a Gestión de Calidad.`,
        REGISTRAR_RECHAZO: `${result.registro.codigo} fue rechazado y retornó para ajustes.`,
        CERRAR_FORMATO: `${result.registro.codigo} fue finalizado como aprobado.`,
      };
      setNotice(workflowNotices[action] ?? "El estado del registro fue actualizado.");
      closeModal();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible actualizar el flujo.");
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = modalMode === "create" ? "Crear Gestión de Cambio" : modalMode === "edit" ? "Editar Gestión de Cambio" : "Detalle de Gestión de Cambio";

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-5 font-sans text-[#08142f] sm:px-6 lg:px-10">
      {error ? (
        <div className="fixed bottom-5 right-5 z-[70] max-w-md rounded-md border border-red-200 bg-white p-4 shadow-xl" role="alert">
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button type="button" onClick={() => setError("")} className="mt-2 text-xs font-black uppercase text-slate-600 hover:text-slate-950">
            Cerrar
          </button>
        </div>
      ) : null}
      {notice ? (
        <div className="fixed bottom-5 right-5 z-[70] max-w-md rounded-md border border-emerald-200 bg-white p-4 shadow-xl" role="status">
          <p className="text-sm font-bold text-emerald-800">{notice}</p>
          <button type="button" onClick={() => setNotice("")} className="mt-2 text-xs font-black uppercase text-slate-600 hover:text-slate-950">
            Cerrar
          </button>
        </div>
      ) : null}
      <div className="mx-auto max-w-[1360px] space-y-5">
        <GestionCambiosTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "creacion" ? (
          <>
            <header className="overflow-hidden rounded-lg bg-[#111935] text-white shadow-lg shadow-slate-400/30 ring-1 ring-indigo-200">
              <div className="flex flex-col gap-5 bg-[radial-gradient(circle_at_80%_0%,rgba(61,72,140,0.55),transparent_35%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 text-white shadow-inner">
                    <FilePenLine className="size-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white sm:text-2xl">Gestión de Cambios SIG-F006</h1>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
                      Usuario activo: <span className="font-black text-white">{isLoading ? "Cargando..." : usuarioActual?.nombre ?? "Sin usuario"}</span>
                      {usuarioActual ? ` - ${roleLabels[usuarioActual.rol]}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={!usuarioActual || isSaving}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-fit"
                >
                  <Plus className="size-4" />
                  Crear Gestión de Cambio
                </button>
              </div>
            </header>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Total", value: resumen.total, icon: ClipboardCheck, className: "from-white to-slate-100 text-[#08142f]", iconClassName: "bg-slate-100 text-slate-600" },
                { label: "Aprobadas", value: resumen.aprobados, icon: CheckCircle2, className: "from-emerald-50 to-white text-emerald-700", iconClassName: "bg-emerald-100 text-emerald-700" },
                { label: "En proceso", value: resumen.enProceso, icon: RotateCw, className: "from-violet-50 to-white text-violet-700", iconClassName: "bg-violet-100 text-violet-700" },
                { label: "Pendientes", value: resumen.pendientes, icon: Clock3, className: "from-amber-50 to-white text-amber-700", iconClassName: "bg-amber-100 text-amber-700" },
                { label: "Rechazadas", value: resumen.rechazados, icon: XCircle, className: "from-red-50 to-white text-red-700", iconClassName: "bg-red-100 text-red-700" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label} className={`rounded-xl border border-slate-200 bg-gradient-to-br ${item.className} p-4 shadow-sm`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="mt-1 text-2xl font-black">{item.value}</p>
                      </div>
                      <span className={`grid size-9 place-items-center rounded-lg ${item.iconClassName}`}>
                        <Icon className="size-4" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-black text-[#08142f]">Historial de mis registros</h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Registros creados o liderados por ti, incluido su estado actual.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                  {registrosCreacion.length} registros
                </span>
              </div>
              <HistorialGestionCambiosTable
                registros={registrosCreacion}
                emptyTitle="No tienes gestiones de cambio creadas"
                emptyDescription="Cuando crees o lideres una gestión de cambio, permanecerá visible aquí durante todo su ciclo."
                onView={openViewModal}
              />
            </section>
          </>
        ) : activeTab === "aprobacion" ? (
          <AprobacionGestionCambiosView registros={registrosEmpresa} usuarioActual={usuarioActual} onView={openViewModal} onEdit={openEditModal} />
        ) : (
          <ConfiguracionRolesView
            usuarios={usuarios}
            empresaActiva={empresaActiva}
            usuarioActualId={usuarioActualId}
            onUsuarioActualChange={setUsuarioActualId}
            onAddUsuario={addUsuario}
            onDeleteUsuario={deleteUsuario}
          />
        )}
      </div>

      <GestionCambioModal
        isOpen={isModalOpen}
        title={selectedRegistro ? `${modalTitle} - ${selectedRegistro.codigo}` : modalTitle}
        onClose={closeModal}
        formId={modalMode === "create" || modalMode === "edit" ? FORM_ID : undefined}
        showSaveButton={false}
      >
        <div className={isSaving ? "pointer-events-none opacity-60" : ""} aria-busy={isSaving}>
        {modalMode === "view" && selectedRegistro ? (
          <GestionCambioDetalle
            registro={selectedRegistro}
            showApprovalActions
            usuarioActual={usuarioActual}
            responsablesAprobacion={usuarios.filter(
              (responsable) =>
                responsable.activo &&
                responsable.empresa === selectedRegistro.empresa &&
                (responsable.rol === "GERENCIA_ADMINISTRATIVA" || responsable.rol === "APROBADOR_ADICIONAL"),
            )}
            onEdit={() => openEditModal(selectedRegistro)}
            onWorkflowAction={(action, payload) => actualizarFlujoAprobacion(selectedRegistro, action, payload)}
          />
        ) : (
          <SolicitudCambioForm
            formId={FORM_ID}
            empresaActiva={empresaActiva}
            usuarioActual={usuarioActual}
            lideresProceso={usuarios.filter(
              (usuario) => usuario.activo && usuario.empresa === empresaActiva && usuario.rol === "LIDER_PROCESO",
            )}
            usuariosResponsables={usuarios.filter(
              (usuario) => usuario.activo && usuario.empresa === empresaActiva,
            )}
            initialData={modalMode === "edit" ? selectedRegistro?.detalle : undefined}
            onSubmit={saveSolicitud}
          />
        )}
        </div>
      </GestionCambioModal>
    </main>
  );
}
