"use client";

import { Plus } from "lucide-react";

type ButtonAddProps = {
  label: string;
  onClick?: () => void;
  size?: "sm" | "lg";
  isDemo?: boolean;
  variant?: "icon" | "text";
};

export function ButtonAdd({ label, onClick, size = "lg", isDemo = false, variant = "icon" }: ButtonAddProps) {
  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-10 min-w-48 items-center justify-center gap-2 rounded-md border border-blue-600 bg-white px-5 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
      >
        <Plus className="size-4" strokeWidth={2.5} />
        <span>{label}</span>
      </button>
    );
  }

  const iconSizeClass = size === "sm" ? "size-8" : "size-12";
  const plusSizeClass = size === "sm" ? "size-4" : "size-6";
  const className = `${iconSizeClass} group relative inline-grid place-items-center rounded-lg border-2 border-sky-700 bg-white text-slate-950 shadow-sm transition`;
  const content = (
    <>
      <span className="absolute inset-1 rounded-md border border-slate-900/70" />
      <span className="relative grid size-[72%] place-items-center rounded-full border-2 border-emerald-950 bg-lime-400 text-emerald-950 transition group-hover:bg-lime-300">
        <Plus className={plusSizeClass} strokeWidth={3} />
      </span>
    </>
  );

  if (isDemo) {
    return (
      <span aria-hidden="true" title={label} className={`${className} cursor-default`}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`${className} hover:-translate-y-0.5 hover:border-emerald-700 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-500`}
    >
      {content}
    </button>
  );
}
