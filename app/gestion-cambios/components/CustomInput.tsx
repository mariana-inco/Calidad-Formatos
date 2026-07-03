"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type CustomInputProps = {
  id: string;
  label?: string;
  type?: "text" | "date" | "select" | "textarea";
  instance?: number;
  options?: readonly string[];
  value?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
};

const baseInputClassName =
  "block w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-100";

export function CustomInput({ id, label, type = "text", instance = 0, options = [], value, placeholder, icon, onChange }: CustomInputProps) {
  const inputId = instance ? `${id}-${instance}` : id;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const selectedValue = value ?? internalValue;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const updateValue = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      {label ? (
        <label htmlFor={inputId} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-950">
          {icon ? <span className="text-teal-700">{icon}</span> : null}
          {label}
        </label>
      ) : null}

      {type === "select" ? (
        <>
          <input type="hidden" id={inputId} name={inputId} value={selectedValue} />
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
                event.preventDefault();
                setIsOpen(true);
              }

              if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
            className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-950 outline-none transition focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-100"
          >
            <span className={selectedValue ? "whitespace-normal break-words" : "text-slate-500"}>{selectedValue || placeholder || "Seleccione una opción"}</span>
            <ChevronDown className={`size-5 shrink-0 text-slate-600 transition ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen ? (
            <div className="absolute left-0 top-full z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-slate-300 bg-white py-1 text-sm shadow-lg">
              <button
                type="button"
                role="option"
                aria-selected={!selectedValue}
                onClick={() => updateValue("")}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                className="block w-full px-4 py-2 text-left text-slate-500 transition hover:bg-teal-50 hover:text-slate-950"
              >
                {placeholder || "Seleccione una opción"}
              </button>
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selectedValue === option}
                  onClick={() => updateValue(option)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsOpen(false);
                    }
                  }}
                  className={`block w-full whitespace-normal break-words px-4 py-2 text-left leading-5 transition ${
                    selectedValue === option ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-950 hover:bg-teal-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </>
      ) : type === "textarea" ? (
        <textarea
          id={inputId}
          name={inputId}
          value={selectedValue}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${baseInputClassName} min-h-20 resize-y`}
        />
      ) : (
        <input
          id={inputId}
          name={inputId}
          type={type}
          value={selectedValue}
          onChange={(event) => updateValue(event.target.value)}
          placeholder={placeholder || (type === "date" ? "dd/mm/aaaa" : undefined)}
          className={baseInputClassName}
        />
      )}
    </div>
  );
}
