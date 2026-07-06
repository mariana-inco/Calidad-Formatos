"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AprobacionGestionCambiosView } from "./AprobacionGestionCambiosView";
import { ConfiguracionRolesView } from "./ConfiguracionRolesView";
import { GestionCambioDetalle, type WorkflowPayload } from "./GestionCambioDetalle";
import { GestionCambioModal } from "./GestionCambioModal";
import { SolicitudCambioForm } from "./GestionCambiosForm";
import { GestionCambiosTabs, type GestionCambiosTab } from "./GestionCambiosTabs";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import { registrosMock, usuariosMock } from "./mockData";
import type { GestionCambio, GestionCambioEmpresa, GestionCambioWorkflowAction, SolicitudCambioData, UsuarioGestionCambio } from "./types";
import { canAccessApproval, filterRegistrosForCreation, roleLabels } from "./workflow";

const FORM_ID = "solicitud-cambio-form";
const empresaActiva: GestionCambioEmpresa = "Incominería";

type ModalMode = "create" | "view" | "edit";

function getNextCodigo(registros: GestionCambio[]) {
  const nextNumber = registros.reduce((max, registro) => {
    const match = registro.codigo.match(/GC-2026-(\d+)$/);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 0) + 1;

  return `GC-2026-${String(nextNumber).padStart(3, "0")}`;
}

function buildRegistro(data: SolicitudCambioData, usuarioActual: UsuarioGestionCambio, registros: GestionCambio[]): GestionCambio {
  return {
    id: crypto.randomUUID(),
    codigo: getNextCodigo(registros),
    fecha: new Date().toISOString().slice(0, 10),
    empresa: data.empresa,
    liderProceso: data.liderProceso || usuarioActual.nombre,
    proceso: data.proceso || usuarioActual.proceso || "Sin diligenciar",
    tipoCambio: data.tiposCambio.length > 0 ? data.tiposCambio.join(", ") : "Sin diligenciar",
    estado: "EN_REVISION",
    responsableActual: "GESTION_CALIDAD",
    creadorId: usuarioActual.id,
    liderProcesoId: usuarioActual.rol === "LIDER_PROCESO" ? usuarioActual.id : undefined,
    historial: [
      {
        accion: "REENVIAR_CALIDAD",
        fecha: new Date().toISOString(),
        usuario: usuarioActual.nombre,
        observaciones: "Registro creado y enviado a revisión de Calidad.",
      },
    ],
    detalle: data,
  };
}

export function GestionCambiosPage() {
  const [registros, setRegistros] = useState<GestionCambio[]>(registrosMock);
  const [usuarios, setUsuarios] = useState<UsuarioGestionCambio[]>(usuariosMock);
  const [usuarioActualId, setUsuarioActualId] = useState(usuariosMock[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<GestionCambiosTab>("creacion");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedRegistro, setSelectedRegistro] = useState<GestionCambio | null>(null);

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

  const saveSolicitud = (data: SolicitudCambioData) => {
    if (!usuarioActual) return;

    if (modalMode === "edit" && selectedRegistro) {
      const updated: GestionCambio = {
        ...selectedRegistro,
        liderProceso: data.liderProceso || selectedRegistro.liderProceso,
        proceso: data.proceso || selectedRegistro.proceso,
        tipoCambio: data.tiposCambio.length > 0 ? data.tiposCambio.join(", ") : selectedRegistro.tipoCambio,
        detalle: data,
      };

      setRegistros((items) => items.map((item) => (item.id === selectedRegistro.id ? updated : item)));
      setSelectedRegistro(updated);
      closeModal();
      return;
    }

    const registroJson = buildRegistro(data, usuarioActual, registros);
    console.log("Mock Gestión de Cambio SIG-F006", [registroJson]);
    setRegistros((items) => [registroJson, ...items]);
    closeModal();
  };

  const addUsuario = (usuario: UsuarioGestionCambio) => {
    setUsuarios((items) => [...items, usuario]);
    setUsuarioActualId((current) => current || usuario.id);
  };

  const deleteUsuario = (usuarioId: string) => {
    if (usuarioActualId === usuarioId) {
      setUsuarioActualId(usuarios.find((usuario) => usuario.id !== usuarioId && usuario.activo)?.id ?? "");
    }

    setUsuarios((items) => items.filter((item) => item.id !== usuarioId));
  };

  const actualizarFlujoAprobacion = (registro: GestionCambio, action: GestionCambioWorkflowAction, payload?: WorkflowPayload) => {
    const now = new Date().toISOString();
    const usuario = usuarioActual?.nombre ?? "Usuario mock";

    setRegistros((items) =>
      items.map((item) => {
        if (item.id !== registro.id) return item;

        const historialEntry = { accion: action, fecha: now, usuario, observaciones: payload?.observacionesCorreccion ?? payload?.validacionCalidad };

        if (action === "SOLICITAR_CORRECCION") {
          return {
            ...item,
            estado: "REQUIERE_CORRECCION",
            responsableActual: "LIDER_PROCESO",
            observacionesCorreccion: payload?.observacionesCorreccion,
            historial: [...item.historial, historialEntry],
          };
        }

        if (action === "REENVIAR_CALIDAD") {
          return {
            ...item,
            estado: "EN_REVISION",
            responsableActual: "GESTION_CALIDAD",
            historial: [...item.historial, historialEntry],
          };
        }

        if (action === "VALIDAR_REMITIR") {
          return {
            ...item,
            estado: "PENDIENTE_FIRMA",
            responsableActual: "GERENCIA_ADMINISTRATIVA",
            validacionCalidad: payload?.validacionCalidad,
            seguimiento: payload?.seguimiento,
            historial: [...item.historial, historialEntry],
          };
        }

        if (action === "REGISTRAR_FIRMA") {
          return {
            ...item,
            estado: "EN_SEGUIMIENTO",
            responsableActual: "GESTION_CALIDAD",
            firmaGerencia: {
              nombre: payload?.firmaGerencia ?? usuario,
              fecha: new Date().toISOString().slice(0, 10),
            },
            historial: [...item.historial, historialEntry],
          };
        }

        return {
          ...item,
          estado: "CERRADO",
          seguimiento: payload?.seguimiento,
          historial: [...item.historial, historialEntry],
        };
      }),
    );

    setSelectedRegistro((current) => {
      if (!current || current.id !== registro.id) return current;
      const refreshed = registros.find((item) => item.id === registro.id) ?? current;
      return { ...refreshed };
    });
    closeModal();
  };

  const modalTitle = modalMode === "create" ? "Crear Gestión de Cambio" : modalMode === "edit" ? "Editar Gestión de Cambio" : "Detalle de Gestión de Cambio";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <GestionCambiosTabs activeTab={activeTab} onChange={setActiveTab} showApproval={canShowApproval} />

        {activeTab === "creacion" ? (
          <>
            <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-950 sm:text-3xl">Gestión de Cambios</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Usuario activo: <span className="font-bold text-slate-950">{usuarioActual?.nombre ?? "Sin usuario"}</span>
                    {usuarioActual ? ` - ${roleLabels[usuarioActual.rol]}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-800">Código: SIG-F006</span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">Mock data</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={!usuarioActual}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-emerald-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-fit"
                >
                  <Plus className="size-5" />
                  Crear Gestión de Cambio
                </button>
              </div>
            </header>

            <HistorialGestionCambiosTable
              registros={registrosCreacion}
              emptyTitle="No tienes gestiones de cambio creadas"
              emptyDescription="En esta pestaña solo ves los registros creados por el usuario activo."
              onView={openViewModal}
            />
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
        showSaveButton={modalMode === "create" || modalMode === "edit"}
      >
        {modalMode === "view" && selectedRegistro ? (
          <GestionCambioDetalle
            registro={selectedRegistro}
            showApprovalActions={activeTab === "aprobacion"}
            usuarioActual={usuarioActual}
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
      </GestionCambioModal>
    </main>
  );
}
