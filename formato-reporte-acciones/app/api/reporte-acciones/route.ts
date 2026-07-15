import { createReporteAcciones, getReporteAccionesData, updateReporteAcciones } from "@/BACKEND/reporte-acciones/reporte-acciones-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getReporteAccionesData());
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible consultar la base de datos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    switch (body.operation) {
      case "create-report":
        return Response.json({ registro: await createReporteAcciones(body.userId, body.data) });
      case "update-report":
        return Response.json({ registro: await updateReporteAcciones(body.registro) });
      default:
        return Response.json({ error: "Operación no reconocida." }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "No fue posible guardar los cambios.";
    return Response.json({ error: message }, { status: 400 });
  }
}
