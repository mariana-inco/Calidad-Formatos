"use client";

import { CalendarDays, ClipboardList, FileCheck2, FileText, Plus, Target, UserRound } from "lucide-react";
import { DynamicSelect } from "./DynamicSelect";
import { tiposAccion } from "./reporteAccionesData";
import { Field, inputClassName, textareaClassName } from "./Field";

export type AccionFormState = {
  tipoAccion: string;
  descripcionAccion: string;
  fechaImplementacion: string;
  responsableImplementacion: string;
  resultadoEsperado: string;
  evidenciaRequerida: string;
  observaciones: string;
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
  resultadoEsperado: "",
  evidenciaRequerida: "",
  observaciones: "",
};

export function AccionForm({ value, isEditing, error, onChange, onSubmit }: AccionFormProps) {
  return (
    <div className="space-y-6">
      <h3 className="border-t border-[#dfe7f2] pt-7 text-xl font-black uppercase text-[#020a1f]">Acciones para el reporte</h3>

      <div className="grid gap-x-5 gap-y-4 lg:grid-cols-2">
        <DynamicSelect
          id="tipoAccion"
          label="Tipo de acción"
          icon={<ClipboardList className="size-5 text-blue-600" />}
          value={value.tipoAccion}
          options={tiposAccion}
          onChange={(tipoAccion) => onChange({ ...value, tipoAccion })}
        />

        <Field id="fechaImplementacion" label="Fecha de implementación" icon={<CalendarDays className="size-5 text-rose-600" />}>
          <input
            id="fechaImplementacion"
            type="date"
            value={value.fechaImplementacion}
            onChange={(event) => onChange({ ...value, fechaImplementacion: event.target.value })}
            className={inputClassName}
          />
        </Field>

        <Field id="responsableImplementacion" label="Responsable implementación" icon={<UserRound className="size-5 text-sky-700" />}>
          <input
            id="responsableImplementacion"
            value={value.responsableImplementacion}
            onChange={(event) => onChange({ ...value, responsableImplementacion: event.target.value })}
            placeholder="Nombre del responsable"
            className={inputClassName}
          />
        </Field>

        <div>
          <Field id="descripcionAccion" label="Descripción de la acción" icon={<FileText className="size-5 text-fuchsia-600" />}>
            <textarea
              id="descripcionAccion"
              value={value.descripcionAccion}
              onChange={(event) => onChange({ ...value, descripcionAccion: event.target.value })}
              placeholder="Describa la acción que se va a implementar"
              className={textareaClassName}
            />
          </Field>
        </div>

        <Field id="resultadoEsperado" label="Resultado esperado" icon={<Target className="size-5 text-emerald-600" />}>
          <textarea
            id="resultadoEsperado"
            value={value.resultadoEsperado}
            onChange={(event) => onChange({ ...value, resultadoEsperado: event.target.value })}
            placeholder="Resultado que se espera obtener al implementar la acción"
            className={textareaClassName}
          />
        </Field>

        <Field id="evidenciaRequerida" label="Evidencia requerida" icon={<FileCheck2 className="size-5 text-orange-600" />}>
          <textarea
            id="evidenciaRequerida"
            value={value.evidenciaRequerida}
            onChange={(event) => onChange({ ...value, evidenciaRequerida: event.target.value })}
            placeholder="Documento, registro, imagen o soporte requerido"
            className={textareaClassName}
          />
        </Field>

        <Field id="observacionesAccion" label="Observaciones" icon={<FileText className="size-5 text-rose-600" />}>
          <textarea
            id="observacionesAccion"
            value={value.observaciones}
            onChange={(event) => onChange({ ...value, observaciones: event.target.value })}
            placeholder="Observaciones adicionales de la acción"
            className={textareaClassName}
          />
        </Field>
      </div>

      {error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{error}</div>
      ) : null}

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex h-11 min-w-44 items-center justify-center gap-3 rounded-md bg-blue-600 px-8 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Plus className="size-5" />
          {isEditing ? "Actualizar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
