"use client";

import { ClipboardCheck, FilePlus2, Settings } from "lucide-react";

export type GestionCambiosTab = "creacion" | "aprobacion" | "configuracion";

type GestionCambiosTabsProps = {
  activeTab: GestionCambiosTab;
  onChange: (tab: GestionCambiosTab) => void;
  showApproval?: boolean;
};

const tabs = [
  { id: "creacion" as const, label: "Creación", icon: FilePlus2 },
  { id: "aprobacion" as const, label: "Aprobación", icon: ClipboardCheck },
  { id: "configuracion" as const, label: "Configuración", icon: Settings },
];

export function GestionCambiosTabs({ activeTab, onChange, showApproval = true }: GestionCambiosTabsProps) {
  const visibleTabs = tabs.filter((tab) => tab.id !== "aprobacion" || showApproval);

  return (
    <div className="rounded-md border border-slate-200 bg-[#eef3f8] p-1 shadow-sm">
      <div className={`grid gap-1 ${visibleTabs.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex h-9 items-center justify-center gap-2 rounded-sm px-4 text-xs font-black uppercase transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                isActive
                  ? "bg-white text-[#08142f] shadow-sm"
                  : "bg-transparent text-slate-600 hover:bg-white/70 hover:text-[#08142f]"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
