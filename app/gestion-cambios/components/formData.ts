export const solicitudFields = [
  { id: "nombre-lider-proceso", label: "NOMBRE DEL LIDER DE PROCESO", type: "text", placeholder: "Ingrese nombre completo" },
  { id: "proceso", label: "PROCESO", type: "select", placeholder: "Seleccione un proceso" },
] as const;

export const procesoOptions = [
  "Gerencia",
  "Gestión de Talento Humano",
  "Gestión de Compras",
  "Gestión Administrativa",
  "Gestión Financiera",
  "Gestión de Calidad",
  "Gestión HSE",
  "Equipos y Maquinaria",
  "Gestión de Tecnología",
  "Gestión de Operaciones",
  "Explotación y Producción",
  "Gestión Comercial",
  "Línea de Extensión",
  "Direccion Estratégica",
] as const;

export const tipoCambioField = {
  id: "tipo-cambio",
  label: "TIPO DE CAMBIO",
  type: "select",
  placeholder: "Seleccione tipo",
} as const;

export const tipoCambioOptions = [
  "Proceso (Nuevo proceso: operativo o administrativo, cambios en la operación de un proceso que impacte en otros procesos)",
  "Personal (Nuevos cargos, cambios en funciones, cambios en la estructura del Organigrama, proveedores externos críticos)",
  "Método (Nuevo método, cambios en el método de trabajo, cambios de condiciones de trabajo)",
  "Materiales (Cambios en materia prima, insumos, nuevos productos)",
  "Instalaciones/ Cambios locativos (Nuevos sitios de trabajo, remodelaciones, reubicación de equipos fijos, cambios en estructuras de edificaciones, redistribución de espacios de trabajo)",
  "Requisitos legales y otros requisitos (Legislación o requisitos legales emitidos por entidades de control y/o partes interesadas)",
  "Tecnología/ Maquinaria/ Equipos (Cambios en diseño del equipo, modificaciones en equipos, nuevo equipo/software, equipos de medición, producción más limpia, nueva tecnología en equipos existentes)",
  "OTROS",
] as const;

export const detalleSolicitudFields = [
  { id: "sitio-area-cambio", label: "SITIO Ó ÁREA DONDE SE REALIZARÁ EL CAMBIO", type: "text" },
  { id: "descripcion-cambio-propuesto", label: "DESCRIPCIÓN DEL CAMBIO PROPUESTO (Especifique qué, quién, cómo y porqué)", type: "text" },
] as const;

export const analisisFields = [
  { id: "documentos", label: "DOCUMENTOS", type: "textarea", placeholder: "Descripción de impactos en documentos..." },
  { id: "procesos", label: "PROCESOS", type: "textarea", placeholder: "Descripción de impactos en procesos..." },
  { id: "personas", label: "PERSONAS", type: "textarea", placeholder: "Descripción de impactos en personal..." },
  { id: "instalaciones", label: "INSTALACIONES", type: "textarea", placeholder: "Descripción de impactos en infraestructura..." },
  { id: "tecnologia-maquinaria", label: "TECNOLOGIA / MAQUINARIA", type: "textarea", placeholder: "Descripción de impactos técnicos..." },
  {
    id: "riesgos-organizacionales",
    label: "RIESGOS ORGANIZACIONALES",
    type: "textarea",
    placeholder: "Identificación de riesgos del negocio...",
  },
  {
    id: "peligros-riesgos",
    label: "PELIGROS / RIESGOS (SST)",
    type: "textarea",
    placeholder: "Análisis de seguridad y salud en el trabajo...",
  },
  {
    id: "aspectos-impactos-ambientales",
    label: "ASPECTOS / IMPACTOS AMBIENTALES",
    type: "textarea",
    placeholder: "Análisis de impacto ambiental...",
  },
] as const;

export const planFields = [
  { id: "actividades", label: "ACTIVIDADES", type: "text", placeholder: "Describa la actividad..." },
  { id: "responsable", label: "RESPONSABLE", type: "text", placeholder: "Ingrese responsable" },
  { id: "fecha", label: "FECHA", type: "date", placeholder: "dd/mm/aaaa" },
] as const;
