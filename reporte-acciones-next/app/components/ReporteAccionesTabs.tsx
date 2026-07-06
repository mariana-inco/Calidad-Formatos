"use client";

import { ClipboardList, Settings } from "lucide-react";

export type ReporteAccionesTab = "historial" | "configuracion";

type ReporteAccionesTabsProps = {
  activeTab: ReporteAccionesTab;
  onChange: (tab: ReporteAccionesTab) => void;
};

const tabs = [
  { id: "historial" as const, label: "Historial", icon: ClipboardList },
  { id: "configuracion" as const, label: "Configuración", icon: Settings },
];

export function ReporteAccionesTabs({ activeTab, onChange }: ReporteAccionesTabsProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-sm">
      <div className="grid gap-1 sm:grid-cols-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                isActive ? "bg-white text-emerald-900 shadow-sm" : "bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
