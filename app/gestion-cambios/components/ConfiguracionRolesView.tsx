"use client";

import { CheckCircle2, Clock3, Eye, Plus, RotateCw, Settings, Trash2, UserRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { GestionCambioEmpresa, GestionCambioRol, UsuarioGestionCambio } from "./types";
import { roleLabels } from "./workflow";

type ConfiguracionRolesViewProps = {
  usuarios: UsuarioGestionCambio[];
  empresaActiva: GestionCambioEmpresa;
  usuarioActualId: string;
  onUsuarioActualChange: (usuarioId: string) => void;
  onAddUsuario: (usuario: UsuarioGestionCambio) => void;
  onDeleteUsuario: (usuarioId: string) => void;
};

type RoleConfig = {
  rol: GestionCambioRol;
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
    rol: "GESTION_CALIDAD",
    title: "Gestión de Calidad",
    description: "Valida si el cambio está correctamente documentado, hace seguimiento y cierra el formato.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    rol: "GERENCIA_ADMINISTRATIVA",
    title: "Gerencia Administrativa",
    description: "Recibe las gestiones validadas por Calidad y registra la firma correspondiente.",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-800",
  },
  {
    rol: "APROBADOR_ADICIONAL",
    title: "Aprobadores adicionales",
    description: "Responsables configurables por empresa, proceso o especialidad para aprobar cambios que no pasan por Gerencia.",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
];

const emptyDraft: UsuarioDraft = { nombre: "", correo: "", proceso: "" };

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function UserLine({ usuario, onDelete }: { usuario: UsuarioGestionCambio; onDelete: (usuarioId: string) => void }) {
  const initials = usuario.nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm before:absolute before:left-0 before:top-0 before:h-1 before:w-full before:rounded-t-lg before:bg-gradient-to-r before:from-blue-600 before:to-emerald-400">
      <button
        type="button"
        onClick={() => onDelete(usuario.id)}
        className="absolute right-3 top-3 inline-grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-700"
        aria-label="Quitar usuario"
        title="Quitar usuario"
      >
        <Trash2 className="size-3.5" />
      </button>
      <div className="flex gap-4 pt-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-black text-blue-700">
          {initials || <UserRound className="size-4" />}
        </div>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-xs font-black uppercase text-[#08142f]">{usuario.nombre}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{roleLabels[usuario.rol]}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{usuario.empresa}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-black">
        <span className="inline-flex items-center justify-between rounded-full bg-blue-50 px-2 py-1 text-blue-700"><span className="inline-flex items-center gap-1"><UserRound className="size-3" />Total</span>0</span>
        <span className="inline-flex items-center justify-between rounded-full bg-amber-50 px-2 py-1 text-amber-700"><span className="inline-flex items-center gap-1"><Clock3 className="size-3" />Pendientes</span>0</span>
        <span className="inline-flex items-center justify-between rounded-full bg-emerald-50 px-2 py-1 text-emerald-700"><span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" />Aprobadas</span>0</span>
        <span className="inline-flex items-center justify-between rounded-full bg-violet-50 px-2 py-1 text-violet-700"><span className="inline-flex items-center gap-1"><RotateCw className="size-3" />En progreso</span>0</span>
        <span className="col-span-2 inline-flex items-center justify-between rounded-full bg-red-50 px-2 py-1 text-red-700"><span className="inline-flex items-center gap-1"><XCircle className="size-3" />Rechazadas</span>0</span>
      </div>
    </div>
  );
}

export function ConfiguracionRolesView({
  usuarios,
  empresaActiva,
  usuarioActualId,
  onUsuarioActualChange,
  onAddUsuario,
  onDeleteUsuario,
}: ConfiguracionRolesViewProps) {
  const [editingRole, setEditingRole] = useState<GestionCambioRol | null>(null);
  const [draft, setDraft] = useState<UsuarioDraft>(emptyDraft);

  const usuariosActivos = useMemo(() => usuarios.filter((usuario) => usuario.activo), [usuarios]);

  const addUsuarioToRole = (rol: GestionCambioRol) => {
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

  const openRoleEditor = (rol: GestionCambioRol) => {
    setEditingRole((current) => (current === rol ? null : rol));
    setDraft(emptyDraft);
  };

  return (
    <section className="space-y-5">
      <header className="overflow-hidden rounded-lg bg-[#111935] text-white shadow-lg shadow-slate-400/30 ring-1 ring-indigo-200">
        <div className="flex items-center gap-4 bg-[radial-gradient(circle_at_80%_0%,rgba(61,72,140,0.55),transparent_35%)] px-5 py-5 sm:px-7">
          <div className="grid size-12 shrink-0 place-items-center rounded-md border border-white/15 bg-white/10 text-white shadow-inner">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white sm:text-2xl">Aprobadores y consulta total</h1>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-200">
              Usuarios habilitados para aprobación, consulta completa y reasignación.
              <span className="ml-2 font-black text-white">SIG-F006</span>
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-[#08142f]">Aprobadores</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Usuarios que pueden recibir, revisar y aprobar gestiones de cambio.</p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-blue-700">Empresa activa: {empresaActiva}</span>
        </div>
        <div className="space-y-4">
        {roleConfigs.map((config) => {
          const usuariosRol = usuarios.filter((usuario) => usuario.empresa === empresaActiva && usuario.rol === config.rol && usuario.activo);
          const isEditing = editingRole === config.rol;

          return (
            <article
              key={config.rol}
              className={`rounded-lg border bg-white p-4 transition ${isEditing ? "border-blue-300 border-dashed" : "border-slate-200"}`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${config.badgeClassName}`}>{config.title}</span>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{config.description}</p>

                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {usuariosRol.length > 0 ? (
                      usuariosRol.map((usuario) => <UserLine key={usuario.id} usuario={usuario} onDelete={onDeleteUsuario} />)
                    ) : (
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 lg:col-span-3">
                        <UserRound className="size-3.5" />
                        Sin usuarios asignados
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openRoleEditor(config.rol)}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-[#08142f] transition hover:border-blue-600 hover:text-blue-700"
                >
                  {isEditing ? "Cancelar" : "Cambiar"}
                </button>
              </div>

              {isEditing ? (
                <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-[#f8fbff] p-4">
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-700">
                <Eye className="size-3.5 text-slate-500" />
                Vista de prueba
              </span>
              <p className="mt-2 text-sm leading-5 text-slate-600">
                Selecciona un usuario configurado para validar qué registros ve en la pestaña Aprobación.
              </p>
            </div>
          </div>

          <select
            value={usuarioActualId}
            onChange={(event) => onUsuarioActualChange(event.target.value)}
            className="mt-4 h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Vista temporal de Calidad</option>
            {usuariosActivos.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre} - {usuario.empresa} - {roleLabels[usuario.rol]}
              </option>
            ))}
          </select>
        </article>
        </div>
      </div>
    </section>
  );
}
