# Formato Reporte de Acciones

Proyecto Next.js independiente para el formato web **Reporte de Acciones**.

## Estructura

```txt
formato-reporte-acciones/
  app/        Rutas de Next.js y endpoint /api/reporte-acciones
  BACKEND/    Logica de servidor, base de datos y Prisma
  FRONTEND/   Componentes, pantallas y estilos
  prisma/     Esquema Prisma de Reporte de Acciones
```

## Ejecutar

Desde esta carpeta:

```bash
npm run dev
```

Desde la raiz del repositorio:

```bash
npm run dev:reporte-acciones
```

La app corre en `http://localhost:3001`.

## Regla de organizacion

- Nuevas pantallas o componentes van en `FRONTEND/`.
- Nuevas consultas, guardados o integraciones de datos van en `BACKEND/`.
- Nuevas rutas publicas de Next.js van en `app/`.
