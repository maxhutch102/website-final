import { getDb } from "@/db";
import { isAccessResponse, requireAccess } from "@/db/access";
import { internalDocuments, internalDocumentVersions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const { id } = await context.params;
  const db = await getDb();
  const [version] = await db.select().from(internalDocumentVersions).where(eq(internalDocumentVersions.id, Number(id))).limit(1);
  if (!version) return Response.json({ error: "File not found." }, { status: 404 });
  const [document] = await db.select().from(internalDocuments).where(eq(internalDocuments.id, version.documentId)).limit(1);
  const allowed = document && (
    document.visibility === "all_employees" ||
    (document.visibility === "managers" && ["owner", "admin", "sales", "support"].includes(actor.role)) ||
    (document.visibility === "owner_admin" && ["owner", "admin"].includes(actor.role))
  );
  if (!allowed) return Response.json({ error: "Forbidden." }, { status: 403 });
  const { env } = await import("cloudflare:workers");
  const object = await env.BUCKET.get(version.storageKey);
  if (!object) return Response.json({ error: "Stored file not found." }, { status: 404 });
  const headers = new Headers({
    "Content-Type": version.contentType,
    "Content-Disposition": `inline; filename="${version.filename.replaceAll('"', "")}"`,
    "Cache-Control": "private, no-store",
  });
  return new Response(object.body, { headers });
}
