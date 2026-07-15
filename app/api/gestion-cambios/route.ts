import {
  applyWorkflow,
  createChange,
  createUser,
  deactivateUser,
  getGestionCambiosData,
  updateChange,
} from "@/BACKEND/gestion-cambios/gestion-cambios-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getGestionCambiosData());
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No fue posible consultar la base de datos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    switch (body.operation) {
      case "create-change":
        return Response.json({ registro: await createChange(body.userId, body.data, body.intent) });
      case "update-change":
        return Response.json({ registro: await updateChange(body.id, body.userId, body.data, body.intent) });
      case "workflow":
        return Response.json({ registro: await applyWorkflow(body.id, body.userId, body.action, body.payload) });
      case "create-user":
        return Response.json({ usuario: await createUser(body.usuario) });
      case "deactivate-user":
        await deactivateUser(body.id);
        return Response.json({ ok: true });
      default:
        return Response.json({ error: "Operación no reconocida." }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "No fue posible guardar los cambios.";
    return Response.json({ error: message }, { status: 400 });
  }
}
