"use client";

import { X } from "lucide-react";

type GestionCambioModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  formId?: string;
  showSaveButton?: boolean;
};

export function GestionCambioModal({ isOpen, title, onClose, children, formId, showSaveButton = true }: GestionCambioModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Gestión de cambios</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="inline-grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-7">
          {children}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            Cancelar
          </button>
          {showSaveButton ? (
            <button
              type="submit"
              form={formId}
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-800 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Guardar
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
