"use client";

import { Plus, Settings, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReporteAccionesRol, UsuarioReporteAcciones } from "./types";

type ConfiguracionReporteAccionesViewProps = {
  usuarios: UsuarioReporteAcciones[];
  empresaActiva: string;
  codigoFormato: string;
  usuarioActualId: string;
  onUsuarioActualChange: (usuarioId: string) => void;
  onAddUsuario: (usuario: UsuarioReporteAcciones) => void;
  onDeleteUsuario: (usuarioId: string) => void;
};

type RoleConfig = {
  rol: ReporteAccionesRol;
  title: string;
  description: string;
  badgeClassName: string;
};

type UsuarioDraft = {
  nombre: string;
  correo: string;
  proceso: string;
};

const roleConfigs: RoleConfig[] = [
  {
    rol: "Colaborador",
    title: "Colaborador",
    description: "Puede crear reportes de acciones y enviarlos al líder del proceso para revisión.",
    badgeClassName: "border-slate-200 bg-white text-slate-800",
  },
  {
    rol: "Calidad",
    title: "Gestión de Calidad",
    description: "Revisa el reporte, solicita correcciones, aprueba, define seguimiento y valida el cierre.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    rol: "Líder de proceso",
    title: "Líder de proceso",
    description: "Identifica el hallazgo, diligencia el análisis, define acciones y cierra con evidencias cuando Calidad remite.",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-800",
  },
];

const emptyDraft: UsuarioDraft = { nombre: "", correo: "", proceso: "" };

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function UserLine({ usuario, onDelete }: { usuario: UsuarioReporteAcciones; onDelete: (usuarioId: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-black uppercase text-slate-950">
          <UserRound className="size-3.5 shrink-0 text-slate-500" />
          <span>{usuario.nombre}</span>
          <span className="font-semibold normal-case text-slate-400">({usuario.correo})</span>
        </p>
        <p className="mt-1 pl-6 text-xs font-semibold text-slate-500">
          {usuario.empresa}
          {usuario.proceso ? ` - Proceso: ${usuario.proceso}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(usuario.id)}
        className="inline-grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-700"
        aria-label="Quitar usuario"
        title="Quitar usuario"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function ConfiguracionReporteAccionesView({
  usuarios,
  empresaActiva,
  codigoFormato,
  usuarioActualId,
  onUsuarioActualChange,
  onAddUsuario,
  onDeleteUsuario,
}: ConfiguracionReporteAccionesViewProps) {
  const [editingRole, setEditingRole] = useState<ReporteAccionesRol | null>(null);
  const [draft, setDraft] = useState<UsuarioDraft>(emptyDraft);

  const usuariosActivos = useMemo(() => usuarios.filter((usuario) => usuario.activo), [usuarios]);

  const addUsuarioToRole = (rol: ReporteAccionesRol) => {
    const nombre = draft.nombre.trim();
    const correo = draft.correo.trim();
    const proceso = draft.proceso.trim();

    if (!nombre || !correo) return;

    const alreadyExists = usuarios.some(
      (usuario) => normalizeText(usuario.correo) === normalizeText(correo) && usuario.rol === rol && usuario.empresa === empresaActiva,
    );
    if (alreadyExists) return;

    onAddUsuario({
      id: crypto.randomUUID(),
      nombre,
      correo,
      empresa: empresaActiva,
      rol,
      proceso: proceso || undefined,
      activo: true,
    });
    setDraft(emptyDraft);
  };

  const openRoleEditor = (rol: ReporteAccionesRol) => {
    setEditingRole((current) => (current === rol ? null : rol));
    setDraft(emptyDraft);
  };

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <Settings className="mt-1 size-4 text-slate-500" />
          <div>
            <h1 className="text-lg font-black text-slate-950">Configuración de Roles</h1>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Asigna responsables internos del flujo del formato. Los permisos generales de acceso se administran desde ROCA.
              <span className="ml-2 font-bold text-blue-700">{codigoFormato}</span>
            </p>
            <p className="mt-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
              Empresa activa: se toma desde el filtro de ROCA
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-5 sm:p-6">
        {roleConfigs.map((config) => {
          const usuariosRol = usuarios.filter((usuario) => usuario.empresa === empresaActiva && usuario.rol === config.rol && usuario.activo);
          const isEditing = editingRole === config.rol;

          return (
            <article
              key={config.rol}
              className={`rounded-lg border bg-slate-50 p-4 transition ${isEditing ? "border-blue-300 border-dashed bg-white" : "border-slate-200"}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${config.badgeClassName}`}>{config.title}</span>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{config.description}</p>

                  <div className="mt-3 space-y-2">
                    {usuariosRol.length > 0 ? (
                      usuariosRol.map((usuario) => <UserLine key={usuario.id} usuario={usuario} onDelete={onDeleteUsuario} />)
                    ) : (
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                        <UserRound className="size-3.5" />
                        Sin usuarios asignados
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openRoleEditor(config.rol)}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-600 hover:text-blue-700"
                >
                  {isEditing ? "Cancelar" : "Cambiar"}
                </button>
              </div>

              {isEditing ? (
                <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-white p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Nombre</span>
                      <input
                        value={draft.nombre}
                        onChange={(event) => setDraft((current) => ({ ...current, nombre: event.target.value }))}
                        placeholder="Nombre completo"
                        className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Correo o usuario</span>
                      <input
                        value={draft.correo}
                        onChange={(event) => setDraft((current) => ({ ...current, correo: event.target.value }))}
                        placeholder="correo@empresa.com"
                        className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-600">Proceso</span>
                      <input
                        value={draft.proceso}
                        onChange={(event) => setDraft((current) => ({ ...current, proceso: event.target.value }))}
                        placeholder="Solo si aplica"
                        className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => addUsuarioToRole(config.rol)}
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 lg:mt-auto"
                    >
                      <Plus className="size-4" />
                      Añadir a la lista
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}

        <article className="rounded-lg border border-dashed border-blue-200 bg-white p-4">
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700">
              Usuario activo temporal
            </span>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              Selecciona el usuario activo para probar el comportamiento del flujo. En ROCA esto se reemplaza por el usuario autenticado.
            </p>
          </div>

          <select
            value={usuarioActualId}
            onChange={(event) => onUsuarioActualChange(event.target.value)}
            className="mt-4 h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Vista temporal sin usuario asignado</option>
            {usuariosActivos.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre} - {usuario.empresa} - {usuario.rol}
              </option>
            ))}
          </select>
        </article>
      </div>
    </section>
  );
}
