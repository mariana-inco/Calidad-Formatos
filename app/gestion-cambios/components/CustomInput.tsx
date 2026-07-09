"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type CustomInputProps = {
  id: string;
  label?: string;
  type?: "text" | "date" | "select" | "textarea";
  instance?: number;
  options?: readonly (string | { value: string; label: string })[];
  value?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
};

const baseInputClassName =
  "block h-12 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-[#08142f] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100";

export function CustomInput({ id, label, type = "text", instance = 0, options = [], value, placeholder, icon, onChange }: CustomInputProps) {
  const inputId = instance ? `${id}-${instance}` : id;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const selectedValue = value ?? internalValue;
  const normalizedOptions = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
  const selectedLabel = normalizedOptions.find((option) => option.value === selectedValue)?.label ?? selectedValue;

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
        <label htmlFor={inputId} className="flex items-center gap-2 text-[11px] font-black text-[#08142f]">
          {icon ? <span className="text-blue-600">{icon}</span> : null}
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
            className="flex h-12 w-full items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-[#08142f] outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            <span className={`min-w-0 flex-1 truncate ${selectedValue ? "" : "text-slate-500"}`}>{selectedLabel || placeholder || "Seleccione una opción"}</span>
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
                className="block w-full px-4 py-2 text-left text-slate-500 transition hover:bg-blue-50 hover:text-slate-950"
              >
                {placeholder || "Seleccione una opción"}
              </button>
              {normalizedOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selectedValue === option.value}
                  onClick={() => updateValue(option.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsOpen(false);
                    }
                  }}
                  className={`block w-full whitespace-normal break-words px-4 py-2 text-left leading-5 transition ${
                    selectedValue === option.value ? "bg-blue-50 font-semibold text-blue-900" : "text-slate-950 hover:bg-blue-50"
                  }`}
                >
                  {option.label}
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
          className={`${baseInputClassName} min-h-24 resize-y`}
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
