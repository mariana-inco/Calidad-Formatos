import type { Metadata } from "next";
import { GestionCambiosPage as GestionCambiosPageContent } from "./components/GestionCambiosPage";

export const metadata: Metadata = {
  title: "SIG-F006 - Gestión de Cambios",
};

export default function GestionCambiosPage() {
  return <GestionCambiosPageContent />;
}
