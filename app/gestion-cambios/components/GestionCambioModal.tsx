"use client";

import { ClipboardList, X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-2 sm:p-6">
      <section className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-1 size-5 text-slate-600" />
            <div>
              <h2 className="text-xl font-black text-slate-700 sm:text-2xl">{title}</h2>
              <p className="mt-5 text-xs font-medium text-slate-500">Completa la información para registrar la solicitud.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="inline-grid size-9 shrink-0 place-items-center rounded-sm border border-blue-300 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#f7fafd] px-4 py-5 sm:px-6">
          {children}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            Cancelar
          </button>
          {showSaveButton ? (
            <button
              type="submit"
              form={formId}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Guardar
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}
