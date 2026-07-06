import type { TipoHallazgo } from "./types";

export const procesos = [
  "Gestión Financiera",
  "Gestión de Tecnología",
  "Gestión HSE",
  "Gestión de Operaciones",
  "Gestión de Calidad",
  "Gestión Humana",
  "Gestión Comercial",
  "Gestión de Compras",
  "Gestión Administrativa",
];

export const tiposHallazgo: TipoHallazgo[] = ["", "No Conformidad", "Oportunidad de Mejora", "Salida No Conforme (SNC)"];

export const tiposAccion = [
  "Seleccione una opción",
  "Corrección",
  "Acción Correctiva",
  "Acción Preventiva",
  "Acción de Mejora",
  "Tratamiento de Salida No Conforme",
];

const fuentesGenerales = [
  "Seleccione una opción",
  "Auditoría Interna",
  "Auditoría Externa",
  "Condición / Acto Inseguro",
  "Contexto de la Organización",
  "Emergencias y Simulacros",
  "Evaluación de Desempeño (Trabajadores)",
  "Evaluación de Proveedores",
  "Evaluación Satisfacción Cliente",
  "Gestión de Cambios",
  "Gestión de Riesgos",
  "Indicadores de Gestión",
  "Inspecciones",
  "Partes Interesadas",
  "Queja / Reclamo de Clientes",
  "Requisito Legal",
  "Revisión por la Dirección",
  "Seguimiento Procesos",
  "No Aplica",
];

export const fuentesPorTipoHallazgo: Record<Exclude<TipoHallazgo, "">, string[]> = {
  "No Conformidad": fuentesGenerales,
  "Oportunidad de Mejora": fuentesGenerales,
  "Salida No Conforme (SNC)": [
    "Seleccione una opción",
    "Despacho de Materiales que no Corresponde a lo Solicitado",
    "Incumplimiento de las Características de Calidad",
    "Incumplimiento de Tiempos de Entrega",
    "Compras que no Cumplen los Requisitos Solicitados",
    "Insumos en Mal Estado",
    "Inadecuada Puesta a Punto del Equipo",
    "Equipo Mal Reparado",
    "Incumplimiento de Perfil para el Cargo",
    "Incumplimiento de la Realización de Ensayos Definidos en el PIE",
    "No Aplica",
  ],
};
