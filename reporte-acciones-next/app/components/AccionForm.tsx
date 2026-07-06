"use client";

import { Plus } from "lucide-react";
import { DynamicSelect } from "./DynamicSelect";
import { tiposAccion } from "./reporteAccionesData";
import { Field, inputClassName, textareaClassName } from "./Field";

export type AccionFormState = {
  tipoAccion: string;
  descripcionAccion: string;
  fechaImplementacion: string;
  responsableImplementacion: string;
};

type AccionFormProps = {
  value: AccionFormState;
  isEditing: boolean;
  error: string;
  onChange: (value: AccionFormState) => void;
  onSubmit: () => void;
};

export const emptyAccionForm: AccionFormState = {
  tipoAccion: "Seleccione una opción",
  descripcionAccion: "",
  fechaImplementacion: "",
  responsableImplementacion: "",
};

export function AccionForm({ value, isEditing, error, onChange, onSubmit }: AccionFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-x-6 gap-y-5 lg:grid-cols-3">
        <DynamicSelect
          id="tipoAccion"
          label="Tipo de acción"
          value={value.tipoAccion}
          options={tiposAccion}
          onChange={(tipoAccion) => onChange({ ...value, tipoAccion })}
        />

        <Field id="fechaImplementacion" label="Fecha de implementación">
          <input
            id="fechaImplementacion"
            type="date"
            value={value.fechaImplementacion}
            onChange={(event) => onChange({ ...value, fechaImplementacion: event.target.value })}
            className={inputClassName}
          />
        </Field>

        <Field id="responsableImplementacion" label="Responsable implementación">
          <input
            id="responsableImplementacion"
            value={value.responsableImplementacion}
            onChange={(event) => onChange({ ...value, responsableImplementacion: event.target.value })}
            placeholder="Nombre del responsable"
            className={inputClassName}
          />
        </Field>

        <div className="lg:col-span-3">
          <Field id="descripcionAccion" label="Descripción de la acción">
            <textarea
              id="descripcionAccion"
              value={value.descripcionAccion}
              onChange={(event) => onChange({ ...value, descripcionAccion: event.target.value })}
              placeholder="Describa la acción que se va a implementar"
              className={`${textareaClassName} min-h-36`}
            />
          </Field>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div>
      ) : null}

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex h-12 min-w-44 items-center justify-center gap-3 rounded-md bg-emerald-900 px-8 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          <Plus className="size-5" />
          {isEditing ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
