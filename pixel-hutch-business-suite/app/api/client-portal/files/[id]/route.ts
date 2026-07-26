import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { clientProjects, employees, leads, projectFiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = await getDb();
  const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, Number(id))).limit(1);
  if (!file) return Response.json({ error: "File not found." }, { status: 404 });
  const [project] = await db.select().from(clientProjects).where(eq(clientProjects.id, file.projectId)).limit(1);
  const [lead] = project ? await db.select().from(leads).where(eq(leads.id, project.leadId)).limit(1) : [];
  const [employee] = await db.select().from(employees).where(eq(employees.email, user.email.toLowerCase())).limit(1);
  const allowed = employee || user.email.toLowerCase() === "mhutchi2517@gmail.com" ||
    (lead && lead.email.toLowerCase() === user.email.toLowerCase() && file.visibleToClient);
  if (!allowed) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { env } = await import("cloudflare:workers");
  const object = await env.BUCKET.get(file.storageKey);
  if (!object) return Response.json({ error: "Stored file not found." }, { status: 404 });
  const headers = new Headers();
  headers.set("Content-Type", file.contentType);
  headers.set("Content-Disposition", `inline; filename="${file.filename.replaceAll('"', "")}"`);
  headers.set("Cache-Control", "private, no-store");
  return new Response(object.body, { headers });
}
