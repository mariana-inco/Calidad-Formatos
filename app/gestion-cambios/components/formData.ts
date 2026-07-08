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
     type: "select",
     placeholder: "Seleccione una opción...",
   },

  { 
    id: "procesos",
    label: "PROCESOS",
    type: "select",
    placeholder: "Seleccione una opción...",
    },

  { id: "personas",
    label: "PERSONAS",
    type: "select",
    placeholder: "Seleccione una opción...",
   },

  { id: "instalaciones",
    label: "INSTALACIONES",
    type: "select",
    placeholder: "Seleccione una opción..." 
  },

  { id: "tecnologia-maquinaria",
    label: "TECNOLOGIA / MAQUINARIA",
    type: "select",
    placeholder: "Seleccione una opción..." },
  {
    id: "riesgos-organizacionales",
    label: "RIESGOS ORGANIZACIONALES",
    type: "select",
    placeholder: "Identificación de riesgos del negocio...",
  },
  {
    id: "peligros-riesgos",
    label: "PELIGROS / RIESGOS (SST)",
    type: "select",
    placeholder: "Análisis de seguridad y salud en el trabajo...",
  },
  {
    id: "aspectos-impactos-ambientales",
    label: "ASPECTOS / IMPACTOS AMBIENTALES",
    type: "select",
    placeholder: "Análisis de impacto ambiental...",
  },
] as const;

export const analisisOptions = {
  documentos: [
    "Se debe crear o actualizar documentación",
    "Afecta la estructura organizacional",
    "Afecta el Plan de Emergencias",
    "Afecta la descripción de cargo / rol establecidos",
    "OTRO",
  ],

  procesos: [
    "Incluye creación de nuevos o modificación en procesos",
    "Afecta en el proceso de inducción",
    "Afecta el alcance del Sistema de gestión",
    "Requiere de nuevos controles operacionales",
    "OTRO",
  ],

  personas: [
    "Se debe contratar personal",
    "Cambia el modelo de contratación",
    "Se modifican funciones / responsabilidades / autoridad",
    "Se modifica el Programa de Capacitación",
    "OTRO",
  ],

  instalaciones: [
    "Remodelación de instalaciones existentes",
    "Nuevas instalaciones",
    "Requiere licenciamiento",
    "Incluye instalación de servicios públicos",
    "OTRO",
  ],

  "tecnologia-maquinaria": [
    "Incluye nueva tecnología",
    "Se va a realizar una prueba piloto antes de implementación plena",
    "OTRO",
  ],

  "riesgos-organizacionales": [
    "Se generaron nuevos o modifican riesgos y oportunidades de sistema de gestión",
    "OTRO",
  ],

  "peligros-riesgos": [
    "Nuevos peligros",
    "Se debe implementar nuevos controles",
    "Continúa el mismo peligro pero cambia la valoración del nivel de riesgo",
    "Afecta los controles existentes",
    "OTRO",
  ],

  "aspectos-impactos-ambientales": [
    "Estaba contemplada la actividad con sus aspectos / impactos",
    "Se debe implementar nuevos controles",
    "Continúa el mismo aspecto pero cambia la valoración del nivel de impacto",
    "Afecta los controles existentes",
    "OTRO",
  ],
} as const;

export const planFields = [
  { id: "actividades", label: "ACTIVIDADES", type: "text", placeholder: "Describa la actividad..." },
  { id: "responsable", label: "RESPONSABLE", type: "text", placeholder: "Ingrese responsable" },
  { id: "fecha", label: "FECHA", type: "date", placeholder: "dd/mm/aaaa" },
] as const;
