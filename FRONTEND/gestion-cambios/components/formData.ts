export const solicitudFields = [
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
  {
     id: "documentos", 
     label: "DOCUMENTOS",
     type: "textarea",
     placeholder: "Describa los documentos afectados, actualizaciones requeridas o impactos documentales del cambio.",
   },

  { 
    id: "procesos",
    label: "PROCESOS",
    type: "textarea",
    placeholder: "Describa los procesos, productos o servicios afectados por el cambio.",
    },

  { id: "personas",
    label: "PERSONAS",
    type: "textarea",
    placeholder: "Describa los cambios en personal, responsabilidades, autoridad o capacitación.",
   },

  { id: "instalaciones",
    label: "INSTALACIONES",
    type: "textarea",
    placeholder: "Describa los cambios locativos, instalaciones, licencias o servicios requeridos." 
  },

  { id: "tecnologia-maquinaria",
    label: "TECNOLOGIA / MAQUINARIA",
    type: "textarea",
    placeholder: "Describa los cambios en tecnología, maquinaria, equipos o pruebas piloto." },
  {
    id: "riesgos-organizacionales",
    label: "RIESGOS ORGANIZACIONALES",
    type: "textarea",
    placeholder: "Describa los riesgos u oportunidades del sistema de gestión asociados al cambio.",
  },
  {
    id: "peligros-riesgos",
    label: "PELIGROS / RIESGOS (SST)",
    type: "textarea",
    placeholder: "Describa los peligros, riesgos SST, valoración y controles antes, durante y después del cambio.",
  },
  {
    id: "aspectos-impactos-ambientales",
    label: "ASPECTOS / IMPACTOS AMBIENTALES",
    type: "textarea",
    placeholder: "Describa aspectos, impactos ambientales, valoración y controles antes, durante y después del cambio.",
  },
] as const;

export const analisisGuideQuestions = {
  documentos: [
    "¿Se debe crear o actualizar documentación?",
    "¿Afecta la estructura organizacional?",
    "¿Afecta el Plan de Emergencias?",
    "¿Afecta la descripción de cargo o rol establecidos?",
  ],

  procesos: [
    "¿Incluye creación de nuevos procesos o modificación de procesos existentes?",
    "¿Afecta el proceso de inducción?",
    "¿Afecta el alcance del Sistema de Gestión?",
    "¿Requiere nuevos controles operacionales?",
  ],

  personas: [
    "¿Se debe contratar personal?",
    "¿Cambia el modelo de contratación?",
    "¿Se modifican funciones, responsabilidades o autoridad?",
    "¿Se modifica el programa de capacitación?",
  ],

  instalaciones: [
    "¿Hay remodelación de instalaciones existentes?",
    "¿Se requieren nuevas instalaciones?",
    "¿Requiere licenciamiento?",
    "¿Incluye instalación de servicios públicos?",
  ],

  "tecnologia-maquinaria": [
    "¿Incluye nueva tecnología?",
    "¿Se va a realizar una prueba piloto antes de la implementación plena?",
  ],

  "riesgos-organizacionales": [
    "¿Se generan nuevos riesgos u oportunidades del sistema de gestión?",
    "¿Se modifican riesgos u oportunidades ya identificados?",
  ],

  "peligros-riesgos": [
    "¿Se generan nuevos peligros?",
    "¿Se deben implementar nuevos controles?",
    "¿Continúa el mismo peligro pero cambia la valoración del nivel de riesgo?",
    "¿Afecta los controles existentes?",
  ],

  "aspectos-impactos-ambientales": [
    "¿La actividad ya estaba contemplada con sus aspectos e impactos?",
    "¿Se deben implementar nuevos controles ambientales?",
    "¿Continúa el mismo aspecto pero cambia la valoración del nivel de impacto?",
    "¿Afecta los controles existentes?",
  ],
} as const;

export const planFields = [
  { id: "actividades", label: "ACTIVIDADES", type: "text", placeholder: "Describa la actividad..." },
  { id: "responsable", label: "RESPONSABLE", type: "text", placeholder: "Ingrese responsable" },
  { id: "fecha", label: "FECHA", type: "date", placeholder: "dd/mm/aaaa" },
] as const;
