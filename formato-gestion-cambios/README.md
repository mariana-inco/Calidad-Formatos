# Formato Gestion de Cambios

Proyecto Next.js para el formato **SIG-F006 - Gestion de Cambios**.

## Estructura

```txt
formato-gestion-cambios/
  app/        Rutas de Next.js y endpoint /api/gestion-cambios
  BACKEND/    Logica de servidor, base de datos y Prisma
  FRONTEND/   Componentes, pantallas y estilos
  prisma/     Esquema Prisma de Gestion de Cambios
  public/     Imagenes y archivos publicos
```

## Ejecutar

Desde esta carpeta:

```bash
npm run dev
```

Desde la raiz del repositorio:

```bash
npm run dev:gestion-cambios
```

La app corre en `http://localhost:3000`.

## Regla de organizacion

- Nuevas pantallas o componentes van en `FRONTEND/`.
- Nuevas consultas, guardados o integraciones de datos van en `BACKEND/`.
- Nuevas rutas publicas de Next.js van en `app/`.
