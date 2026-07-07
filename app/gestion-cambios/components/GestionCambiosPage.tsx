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
import { addMonths, canAccessApproval, filterRegistrosForCreation, roleLabels } from "./workflow";

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

function buildRegistro(data: SolicitudCambioData, usuarioActual: UsuarioGestionCambio, registros: GestionCambio[], usuarios: UsuarioGestionCambio[]): GestionCambio {
  const calidad = usuarios.find((usuario) => usuario.empresa === data.empresa && usuario.rol === "GESTION_CALIDAD" && usuario.activo);
  const aprobador = usuarios.find((usuario) => usuario.id === data.aprobadorSeleccionadoId && usuario.activo);
  const now = new Date();
  const completedAt = new Date(now.getTime() + 1000);
  const fecha = now.toISOString().slice(0, 10);

  return {
    id: crypto.randomUUID(),
    codigo: getNextCodigo(registros),
    fecha,
    empresa: data.empresa,
    liderProceso: data.liderProceso || usuarioActual.nombre,
    liderProcesoId: data.liderProcesoId ?? (usuarioActual.rol === "LIDER_PROCESO" ? usuarioActual.id : undefined),
    proceso: data.proceso || usuarioActual.proceso || "Sin diligenciar",
    tipoCambio: data.tiposCambio.length > 0 ? data.tiposCambio.join(", ") : "Sin diligenciar",
    estado: "CREADO",
    responsableActual: usuarioActual.rol === "LIDER_PROCESO" ? "LIDER_PROCESO" : "GESTION_CALIDAD",
    responsableActualId: usuarioActual.rol === "LIDER_PROCESO" ? usuarioActual.id : calidad?.id,
    responsableActualNombre: usuarioActual.rol === "LIDER_PROCESO" ? usuarioActual.nombre : calidad?.nombre ?? "Gestión de Calidad",
    creadorId: usuarioActual.id,
    aprobadorSeleccionadoId: aprobador?.id,
    aprobadorSeleccionadoNombre: aprobador?.nombre,
    aprobadorSeleccionadoRol: aprobador?.rol,
    historial: [
      {
        accion: "CREAR_REGISTRO",
        fecha: now.toISOString(),
        usuario: usuarioActual.nombre,
        rol: usuarioActual.rol,
        estadoNuevo: "BORRADOR",
        observaciones: "El líder identifica la necesidad de gestionar un cambio y crea el registro SIG-F006 en borrador.",
      },
      {
        accion: "COMPLETAR_SOLICITUD",
        fecha: completedAt.toISOString(),
        usuario: usuarioActual.nombre,
        rol: usuarioActual.rol,
        estadoAnterior: "BORRADOR",
        estadoNuevo: "CREADO",
        observaciones: "Diligencia el formato SIG-F006, registra análisis asociados y define el plan de implementación del cambio.",
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
      const nextState = selectedRegistro.estado === "BORRADOR" ? "CREADO" : selectedRegistro.estado;
      const changedToCreated = selectedRegistro.estado === "BORRADOR" && nextState === "CREADO";
      const updated: GestionCambio = {
        ...selectedRegistro,
        liderProceso: data.liderProceso || selectedRegistro.liderProceso,
        liderProcesoId: data.liderProcesoId ?? selectedRegistro.liderProcesoId,
        proceso: data.proceso || selectedRegistro.proceso,
        tipoCambio: data.tiposCambio.length > 0 ? data.tiposCambio.join(", ") : selectedRegistro.tipoCambio,
        estado: nextState,
        responsableActual: nextState === "CREADO" ? "LIDER_PROCESO" : selectedRegistro.responsableActual,
        responsableActualId: nextState === "CREADO" ? selectedRegistro.liderProcesoId ?? usuarioActual.id : selectedRegistro.responsableActualId,
        responsableActualNombre: nextState === "CREADO" ? selectedRegistro.liderProceso : selectedRegistro.responsableActualNombre,
        observacionesCorreccion: undefined,
        detalle: data,
        historial:
          changedToCreated
            ? [
                ...selectedRegistro.historial,
                {
                  accion: "COMPLETAR_SOLICITUD",
                  fecha: new Date().toISOString(),
                  usuario: usuarioActual.nombre,
                  rol: usuarioActual.rol,
                  estadoAnterior: selectedRegistro.estado,
                  estadoNuevo: "CREADO",
                  observaciones: "Diligencia el formato SIG-F006, registra análisis asociados y define el plan de implementación del cambio.",
                },
              ]
            : selectedRegistro.historial,
      };

      setRegistros((items) => items.map((item) => (item.id === selectedRegistro.id ? updated : item)));
      setSelectedRegistro(updated);
      closeModal();
      return;
    }

    const registroJson = buildRegistro(data, usuarioActual, registros, usuarios);
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
    let updatedRegistro: GestionCambio | undefined;

    setRegistros((items) =>
      items.map((item) => {
        if (item.id !== registro.id) return item;

        const historialEntry = {
          accion: action,
          fecha: now,
          usuario,
          rol: usuarioActual?.rol,
          estadoAnterior: item.estado,
          observaciones: payload?.observacionesCorreccion ?? payload?.validacionCalidad ?? payload?.aprobacion?.observaciones ?? payload?.seguimiento?.observaciones,
        };

        if (action === "SOLICITAR_CORRECCION") {
          updatedRegistro = {
            ...item,
            estado: "DEVUELTO_LIDER",
            responsableActual: "LIDER_PROCESO",
            responsableActualId: item.liderProcesoId,
            responsableActualNombre: item.liderProceso,
            observacionesCorreccion: payload?.observacionesCorreccion,
            historial: [...item.historial, { ...historialEntry, estadoNuevo: "DEVUELTO_LIDER" }],
          };
          return updatedRegistro;
        }

        if (action === "REENVIAR_CALIDAD") {
          const calidad = usuarios.find((responsable) => responsable.empresa === item.empresa && responsable.rol === "GESTION_CALIDAD" && responsable.activo);
          updatedRegistro = {
            ...item,
            estado: "EN_REVISION_CALIDAD",
            responsableActual: "GESTION_CALIDAD",
            responsableActualId: calidad?.id,
            responsableActualNombre: calidad?.nombre ?? "Gestión de Calidad",
            historial: [
              ...item.historial,
              {
                ...historialEntry,
                estadoNuevo: "EN_REVISION_CALIDAD",
                observaciones: "El líder envía el SIG-F006 a Gestión de Calidad para revisión inicial.",
              },
            ],
          };
          return updatedRegistro;
        }

        if (action === "VALIDAR_REMITIR") {
          const aprobador = usuarios.find((responsable) => responsable.id === item.aprobadorSeleccionadoId && responsable.activo);

          updatedRegistro = {
            ...item,
            estado: "PENDIENTE_APROBACION",
            responsableActual: aprobador?.rol ?? item.aprobadorSeleccionadoRol ?? "GERENCIA_ADMINISTRATIVA",
            responsableActualId: aprobador?.id ?? item.aprobadorSeleccionadoId,
            responsableActualNombre: aprobador?.nombre ?? item.aprobadorSeleccionadoNombre,
            validacionCalidad: payload?.validacionCalidad,
            historial: [
              ...item.historial,
              {
                ...historialEntry,
                estadoNuevo: "PENDIENTE_APROBACION",
                observaciones: payload?.validacionCalidad || `Calidad valida que el cambio está conforme y remite el registro a ${aprobador?.nombre ?? item.aprobadorSeleccionadoNombre ?? "el responsable aprobador"}.`,
              },
            ],
          };
          return updatedRegistro;
        }

        if (action === "REGISTRAR_APROBACION") {
          const fechaAprobacion = payload?.aprobacion?.fecha ?? new Date().toISOString().slice(0, 10);
          const fechaLimiteCierre = addMonths(fechaAprobacion, 3);
          const calidad = usuarios.find((responsable) => responsable.empresa === item.empresa && responsable.rol === "GESTION_CALIDAD" && responsable.activo);
          updatedRegistro = {
            ...item,
            estado: "EN_SEGUIMIENTO_CALIDAD",
            responsableActual: "GESTION_CALIDAD",
            responsableActualId: calidad?.id,
            responsableActualNombre: calidad?.nombre ?? "Gestión de Calidad",
            aprobacion: payload?.aprobacion,
            fechaAprobacion,
            fechaInicioSeguimiento: fechaAprobacion,
            fechaLimiteCierre,
            historial: [
              ...item.historial,
              {
                ...historialEntry,
                estadoNuevo: "EN_SEGUIMIENTO_CALIDAD",
                observaciones: payload?.aprobacion?.observaciones
                  ? `${payload.aprobacion.observaciones} El registro vuelve a Gestión de Calidad para seguimiento y cierre final. Fecha límite de cierre: ${fechaLimiteCierre}.`
                  : `Gerencia Administrativa aprueba el cambio. El registro vuelve a Gestión de Calidad para seguimiento y cierre final. Fecha límite de cierre: ${fechaLimiteCierre}.`,
              },
            ],
          };
          return updatedRegistro;
        }

        if (action === "REGISTRAR_RECHAZO") {
          updatedRegistro = {
            ...item,
            estado: "RECHAZADO_APROBADOR",
            responsableActual: "LIDER_PROCESO",
            responsableActualId: item.liderProcesoId,
            responsableActualNombre: item.liderProceso,
            aprobacion: payload?.aprobacion,
            historial: [
              ...item.historial,
              {
                ...historialEntry,
                estadoNuevo: "RECHAZADO_APROBADOR",
                observaciones: payload?.aprobacion?.observaciones || "El responsable aprobador rechaza el cambio y lo devuelve al líder de proceso.",
              },
            ],
          };
          return updatedRegistro;
        }

        updatedRegistro = {
          ...item,
          estado: "CERRADO",
          responsableActual: "GESTION_CALIDAD",
          seguimiento: payload?.seguimiento,
          fechaCierre: payload?.seguimiento?.fechaCierre ?? new Date().toISOString().slice(0, 10),
          historial: [
            ...item.historial,
            {
              ...historialEntry,
              estadoNuevo: "CERRADO",
              observaciones: payload?.seguimiento?.observaciones || "Calidad registra observaciones finales y cierra el formato SIG-F006.",
            },
          ],
        };
        return updatedRegistro;
      }),
    );

    setSelectedRegistro((current) => {
      if (!current || current.id !== registro.id) return current;
      return updatedRegistro ? { ...updatedRegistro } : current;
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
              emptyDescription="En esta pestaña consultas los registros creados por ti o asociados a tu proceso, junto con su estado e historial."
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
            responsablesAprobacion={usuarios.filter(
              (responsable) =>
                responsable.activo &&
                responsable.empresa === empresaActiva &&
                (responsable.rol === "GERENCIA_ADMINISTRATIVA" || responsable.rol === "APROBADOR_ADICIONAL" || responsable.rol === "LIDER_PROCESO"),
            )}
            onSubmit={saveSolicitud}
          />
        )}
      </GestionCambioModal>
    </main>
  );
}
