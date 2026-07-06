"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type DynamicSelectProps = {
  id: string;
  label?: string;
  value: string;
  options: readonly string[];
  placeholder?: string;
  compact?: boolean;
  onChange: (value: string) => void;
};

export function DynamicSelect({ id, label, value, options, placeholder = "Seleccione una opción", compact = false, onChange }: DynamicSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = value || placeholder;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const openFromKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label ? (
        <label htmlFor={id} className="text-xs font-black uppercase tracking-wide text-slate-950">
          {label}
        </label>
      ) : null}

      <input type="hidden" id={id} name={id} value={value} />
      <button
        type="button"
        id={`${id}-button`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={openFromKeyboard}
        className={`mt-2 flex w-full items-center justify-between gap-3 rounded-md border bg-slate-50 text-left font-semibold text-slate-950 outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${
          compact ? "min-h-9 px-2 text-xs" : "min-h-12 px-3 text-sm"
        } ${isOpen ? "border-emerald-600 bg-white ring-2 ring-emerald-100" : "border-slate-300"}`}
      >
        <span className={value ? "whitespace-normal break-words" : "text-slate-500"}>{displayValue}</span>
        <ChevronDown className={`shrink-0 text-slate-600 transition ${compact ? "size-4" : "size-5"} ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div
          id={`${id}-options`}
          role="listbox"
          aria-labelledby={`${id}-button`}
          className={`absolute left-0 top-full z-40 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-lg ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {options.map((option) => {
            const optionLabel = option || placeholder;
            const isSelected = value === option;

            return (
              <button
                key={option || "empty"}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => selectOption(option)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                className={`block w-full whitespace-normal break-words px-4 py-2 text-left leading-5 transition ${
                  isSelected ? "bg-emerald-50 font-black text-emerald-950" : "text-slate-950 hover:bg-emerald-50"
                } ${!option ? "text-slate-500" : ""}`}
              >
                {optionLabel}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
