# Formatos SIG

Repositorio organizado por formato. Cada formato vive en su propia carpeta y funciona como proyecto Next.js independiente.

## Carpetas

```txt
gestiondecambios/
  formato-gestion-cambios/    Formato SIG-F006 - Gestion de Cambios
  formato-reporte-acciones/   Formato Reporte de Acciones
```

## Ejecutar desde la raiz

```bash
npm run dev:gestion-cambios
npm run dev:reporte-acciones
```

## Validar desde la raiz

```bash
npm run typecheck:gestion-cambios
npm run typecheck:reporte-acciones
npm run build:gestion-cambios
npm run build:reporte-acciones
```

## Regla de orden

Todo archivo propio de un formato debe vivir dentro de su carpeta:

- Gestion de Cambios: `formato-gestion-cambios/`
- Reporte de Acciones: `formato-reporte-acciones/`

La raiz queda solo para archivos compartidos de control del repositorio, como `.gitignore`, `AGENTS.md` y este README.
