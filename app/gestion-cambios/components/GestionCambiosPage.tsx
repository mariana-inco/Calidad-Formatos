"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AprobacionGestionCambiosView } from "./AprobacionGestionCambiosView";
import { ConfiguracionRolesView } from "./ConfiguracionRolesView";
import { GestionCambioDetalle, type WorkflowPayload } from "./GestionCambioDetalle";
import { GestionCambioModal } from "./GestionCambioModal";
import { SolicitudCambioForm } from "./GestionCambiosForm";
import { GestionCambiosTabs, type GestionCambiosTab } from "./GestionCambiosTabs";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import type { GestionCambio, GestionCambioEmpresa, GestionCambioWorkflowAction, SolicitudCambioData, UsuarioGestionCambio } from "./types";
import { canAccessApproval, filterRegistrosForCreation, roleLabels } from "./workflow";

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

  const registrosCreacion = useMemo(() => filterRegistrosForCreation(registros, usuarioActual), [registros, usuarioActual]);
  const canShowApproval = canAccessApproval(usuarioActual);

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
    try {
      const result = await apiRequest<{ registro: GestionCambio }>({
        operation: "workflow",
        id: registro.id,
        userId: usuarioActual.id,
        action,
        payload,
      });
      setRegistros((items) => items.map((item) => (item.id === result.registro.id ? result.registro : item)));
      closeModal();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible actualizar el flujo.");
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = modalMode === "create" ? "Crear Gestión de Cambio" : modalMode === "edit" ? "Editar Gestión de Cambio" : "Detalle de Gestión de Cambio";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-950 sm:px-6 lg:px-10">
      {error ? (
        <div className="fixed bottom-5 right-5 z-[70] max-w-md rounded-md border border-red-200 bg-white p-4 shadow-xl" role="alert">
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button type="button" onClick={() => setError("")} className="mt-2 text-xs font-black uppercase text-slate-600 hover:text-slate-950">
            Cerrar
          </button>
        </div>
      ) : null}
      <div className="mx-auto max-w-7xl space-y-7">
        <GestionCambiosTabs activeTab={activeTab} onChange={setActiveTab} showApproval={canShowApproval} />

        {activeTab === "creacion" ? (
          <>
            <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-950 sm:text-3xl">Gestión de Cambios</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Usuario activo: <span className="font-bold text-slate-950">{isLoading ? "Cargando..." : usuarioActual?.nombre ?? "Sin usuario"}</span>
                    {usuarioActual ? ` - ${roleLabels[usuarioActual.rol]}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-800">Código: SIG-F006</span>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-800">Base de datos activa</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={!usuarioActual || isSaving}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-emerald-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-fit"
                >
                  <Plus className="size-5" />
                  Crear Gestión de Cambio
                </button>
              </div>
            </header>

            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-black uppercase text-slate-950">Historial de mis registros</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Aquí permanecen los registros creados o liderados por ti, incluido su estado actual y los que ya fueron cerrados.
                </p>
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
          <AprobacionGestionCambiosView registros={registros} usuarioActual={usuarioActual} onView={openViewModal} onEdit={openEditModal} />
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
            initialData={modalMode === "edit" ? selectedRegistro?.detalle : undefined}
            onSubmit={saveSolicitud}
          />
        )}
        </div>
      </GestionCambioModal>
    </main>
  );
}
