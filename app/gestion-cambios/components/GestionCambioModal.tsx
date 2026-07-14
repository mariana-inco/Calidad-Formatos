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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6">
      <section
        className="flex max-h-[90vh] min-w-0 flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        style={{ width: "72vw", minWidth: "960px", maxWidth: "calc(100vw - 48px)" }}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#dfe7f2] bg-white px-7 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-1 size-7 text-[#536784]" />
            <div>
              <h2 className="text-2xl font-black leading-8 text-[#34435e]">{title}</h2>
              <p className="mt-6 max-w-3xl text-base leading-6 text-[#536784]">Completa la información para registrar la solicitud.</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="inline-grid size-10 shrink-0 place-items-center rounded-md bg-white text-[#536784] transition hover:bg-slate-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-w-0 flex-1 overflow-y-auto bg-[#f7fafd] px-3 py-4 sm:px-6">
          <div className="mx-auto min-w-0" style={{ width: "calc(100% - 56px)", maxWidth: "1228px" }}>
            {children}
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
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
