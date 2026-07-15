"use client";

import { ClipboardCheck, ClipboardList, Settings, ShieldCheck } from "lucide-react";

export type ReporteAccionesTab = "historial" | "aprobacion" | "eficacia" | "configuracion";

type ReporteAccionesTabsProps = {
  activeTab: ReporteAccionesTab;
  onChange: (tab: ReporteAccionesTab) => void;
};

const tabs = [
  { id: "historial" as const, label: "Historial", icon: ClipboardList },
  { id: "aprobacion" as const, label: "Aprobación", icon: ClipboardCheck },
  { id: "eficacia" as const, label: "Validación de eficacia", icon: ShieldCheck },
  { id: "configuracion" as const, label: "Configuración", icon: Settings },
];

export function ReporteAccionesTabs({ activeTab, onChange }: ReporteAccionesTabsProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-[#eef3f8] p-1 shadow-sm">
      <div className="grid gap-1 sm:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-sm px-4 text-xs font-black uppercase transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive ? "bg-white text-[#071127] shadow-sm" : "bg-transparent text-[#50617d] hover:bg-white/70 hover:text-[#071127]"
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
