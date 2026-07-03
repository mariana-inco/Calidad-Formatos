"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AprobacionGestionCambiosView } from "./AprobacionGestionCambiosView";
import { ConfiguracionRolesView } from "./ConfiguracionRolesView";
import { GestionCambioDetalle } from "./GestionCambioDetalle";
import { GestionCambioModal } from "./GestionCambioModal";
import { SolicitudCambioForm } from "./GestionCambiosForm";
import { GestionCambiosTabs, type GestionCambiosTab } from "./GestionCambiosTabs";
import { HistorialGestionCambiosTable } from "./HistorialGestionCambiosTable";
import type { GestionCambio, GestionCambioEmpresa, GestionCambioWorkflowAction, SolicitudCambioData, UsuarioGestionCambio } from "./types";

const FORM_ID = "solicitud-cambio-form";
const registrosIniciales: GestionCambio[] = [];
const usuariosIniciales: UsuarioGestionCambio[] = [];
const empresaActiva: GestionCambioEmpresa = "Incominería";

type ModalMode = "create" | "view" | "edit";

function getAprobadorDesdeUsuario(usuario?: UsuarioGestionCambio) {
  if (!usuario) return "Gestión de Calidad";
  if (usuario.rol === "Calidad") return "Gestión de Calidad";
  if (usuario.rol === "Gerencia Administrativa") return "Gerencia Administrativa";
  return usuario.proceso || usuario.nombre;
}

export function GestionCambiosPage() {
  const [registros, setRegistros] = useState<GestionCambio[]>(registrosIniciales);
  const [usuarios, setUsuarios] = useState<UsuarioGestionCambio[]>(usuariosIniciales);
  const [usuarioActualId, setUsuarioActualId] = useState("");
  const [activeTab, setActiveTab] = useState<GestionCambiosTab>("creacion");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [selectedRegistro, setSelectedRegistro] = useState<GestionCambio | null>(null);

  const usuarioActual = useMemo(
    () => usuarios.find((usuario) => usuario.id === usuarioActualId && usuario.activo),
    [usuarioActualId, usuarios],
  );
  const aprobadorActual = useMemo(() => getAprobadorDesdeUsuario(usuarioActual), [usuarioActual]);

  const modalTitle = useMemo(() => {
    if (modalMode === "view") return "Detalle de Gestión de Cambio";
    if (modalMode === "edit") return "Editar Gestión de Cambio";
    return "Crear Gestión de Cambio";
  }, [modalMode]);

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
    if (modalMode === "create") {
      const nextNumber = String(registros.length + 1).padStart(3, "0");
      setRegistros((items) => [
        {
          id: crypto.randomUUID(),
          codigo: `GC-2026-${nextNumber}`,
          fecha: new Date().toISOString().slice(0, 10),
          empresa: data.empresa,
          liderProceso: data.liderProceso || "Sin diligenciar",
          proceso: data.proceso || "Sin diligenciar",
          aprobador: "Gestión de Calidad",
          tipoCambio: data.tiposCambio.length > 0 ? data.tiposCambio.join(", ") : "Sin diligenciar",
          estado: "En revisión",
          aprobacion: "Pendiente",
          detalle: data,
        },
        ...items,
      ]);
    }

    closeModal();
  };

  const deleteRegistro = (registroId: string) => {
    setRegistros((items) => items.filter((item) => item.id !== registroId));
  };

  const addUsuario = (usuario: UsuarioGestionCambio) => {
    setUsuarios((items) => [...items, usuario]);
    setUsuarioActualId((current) => current || usuario.id);
  };

  const deleteUsuario = (usuarioId: string) => {
    if (usuarioActualId === usuarioId) {
      setUsuarioActualId("");
    }

    setUsuarios((items) => items.filter((item) => item.id !== usuarioId));
  };

  const actualizarFlujoAprobacion = (registro: GestionCambio, action: GestionCambioWorkflowAction) => {
    const workflowUpdates: Record<GestionCambioWorkflowAction, Pick<GestionCambio, "estado" | "aprobacion" | "aprobador">> = {
      "solicitar-correccion": {
        estado: "Requiere corrección",
        aprobacion: "Devuelta",
        aprobador: registro.proceso || "Líder de proceso",
      },
      "validar-remitir": {
        estado: "Pendiente firma",
        aprobacion: "Validada",
        aprobador: "Gerencia Administrativa",
      },
      "registrar-firma": {
        estado: "En seguimiento",
        aprobacion: "Firmada",
        aprobador: "Gestión de Calidad",
      },
      "cerrar-formato": {
        estado: "Cerrado",
        aprobacion: "Cerrada",
        aprobador: "Gestión de Calidad",
      },
    };

    const updatedFields = workflowUpdates[action];

    setRegistros((items) => items.map((item) => (item.id === registro.id ? { ...item, ...updatedFields } : item)));
    setSelectedRegistro((selected) => (selected?.id === registro.id ? { ...selected, ...updatedFields } : selected));
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 font-sans text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">
        <GestionCambiosTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "creacion" ? (
          <>
            <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-2xl font-black uppercase text-slate-950 sm:text-3xl">Gestión de Cambios</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase text-emerald-800">
                      Código: SIG-F006
                    </span>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                      Versión: 04
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-emerald-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:w-fit"
                >
                  <Plus className="size-5" />
                  Crear Gestión de Cambio
                </button>
              </div>
            </header>

            <HistorialGestionCambiosTable registros={registros} onView={openViewModal} onEdit={openEditModal} onDelete={deleteRegistro} />
          </>
        ) : activeTab === "aprobacion" ? (
          <AprobacionGestionCambiosView registros={registros} aprobadorActual={aprobadorActual} usuarioActual={usuarioActual} onView={openViewModal} />
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
        formId={modalMode === "view" ? undefined : FORM_ID}
        showSaveButton={modalMode !== "view"}
      >
        {modalMode === "view" && selectedRegistro ? (
          <GestionCambioDetalle
            registro={selectedRegistro}
            showApprovalActions={activeTab === "aprobacion"}
            onWorkflowAction={(action) => actualizarFlujoAprobacion(selectedRegistro, action)}
          />
        ) : (
          <SolicitudCambioForm formId={FORM_ID} empresaActiva={empresaActiva} onSubmit={saveSolicitud} />
        )}
      </GestionCambioModal>
    </main>
  );
}
