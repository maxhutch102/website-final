import { getDb } from "@/db";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import {
  internalDocumentAcknowledgments, internalDocuments, internalDocumentVersions,
} from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function canView(role: string, visibility: string) {
  if (visibility === "owner_admin") return ["owner", "admin"].includes(role);
  if (visibility === "managers") return ["owner", "admin", "sales", "support"].includes(role);
  return true;
}

async function listLibrary() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const [documents, versions, acknowledgments] = await Promise.all([
    db.select().from(internalDocuments).orderBy(desc(internalDocuments.updatedAt)),
    db.select().from(internalDocumentVersions).orderBy(desc(internalDocumentVersions.createdAt)),
    db.select().from(internalDocumentAcknowledgments),
  ]);
  return Response.json({
    documents: documents.filter(document => canView(actor.role, document.visibility)),
    versions,
    acknowledgments: ["owner", "admin"].includes(actor.role)
      ? acknowledgments
      : acknowledgments.filter(item => item.employeeId === actor.employeeId),
  });
}

export async function GET() {
  return listLibrary();
}

export async function POST(request: Request) {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const contentType = request.headers.get("content-type") || "";
  const db = await getDb();

  if (contentType.includes("application/json")) {
    const body = await request.json() as { action?: string; documentId?: number };
    if (body.action !== "acknowledge" || !actor.employeeId || !body.documentId) {
      return Response.json({ error: "Invalid acknowledgment." }, { status: 400 });
    }
    const [document] = await db.select().from(internalDocuments).where(eq(internalDocuments.id, body.documentId)).limit(1);
    if (!document || !canView(actor.role, document.visibility)) return Response.json({ error: "Not found." }, { status: 404 });
    const [existing] = await db.select().from(internalDocumentAcknowledgments).where(and(
      eq(internalDocumentAcknowledgments.documentId, document.id),
      eq(internalDocumentAcknowledgments.employeeId, actor.employeeId),
      eq(internalDocumentAcknowledgments.version, document.currentVersion),
    )).limit(1);
    if (!existing) await db.insert(internalDocumentAcknowledgments).values({
      documentId: document.id, employeeId: actor.employeeId, version: document.currentVersion,
      acknowledgedAt: new Date().toISOString(),
    });
    await logActivity(actor, "document.acknowledged", "internal_document", document.id, `Acknowledged ${document.title} v${document.currentVersion}.`);
    return listLibrary();
  }

  if (!["owner", "admin"].includes(actor.role)) return Response.json({ error: "Only owners and admins can upload internal documents." }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ error: "Files must be 25 MB or smaller." }, { status: 413 });
  const now = new Date().toISOString();
  const requestedId = Number(form.get("documentId") || 0);
  let documentId = requestedId;
  let version = 1;

  if (requestedId) {
    const [current] = await db.select().from(internalDocuments).where(eq(internalDocuments.id, requestedId)).limit(1);
    if (!current) return Response.json({ error: "Document not found." }, { status: 404 });
    version = current.currentVersion + 1;
    await db.update(internalDocuments).set({ currentVersion: version, status: "active", updatedAt: now }).where(eq(internalDocuments.id, requestedId));
  } else {
    const title = String(form.get("title") || "").trim();
    if (!title) return Response.json({ error: "Document title is required." }, { status: 400 });
    const [created] = await db.insert(internalDocuments).values({
      title,
      description: String(form.get("description") || "").trim(),
      category: String(form.get("category") || "reference"),
      folder: String(form.get("folder") || "General").trim() || "General",
      visibility: String(form.get("visibility") || "all_employees"),
      requiresAcknowledgment: form.get("requiresAcknowledgment") === "on",
      linkedTaskId: Number(form.get("linkedTaskId") || 0) || null,
      createdBy: actor.email, createdAt: now, updatedAt: now,
    }).returning();
    documentId = created.id;
  }

  const storageKey = `internal/${documentId}/v${version}-${crypto.randomUUID()}`;
  const { env } = await import("cloudflare:workers");
  await env.BUCKET.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  await db.insert(internalDocumentVersions).values({
    documentId, version, filename: file.name, storageKey,
    contentType: file.type || "application/octet-stream", sizeBytes: file.size,
    changeNote: String(form.get("changeNote") || "").trim(),
    uploadedBy: actor.email, createdAt: now,
  });
  await logActivity(actor, requestedId ? "document.version_added" : "document.created", "internal_document", documentId, `${requestedId ? "Added a new version of" : "Uploaded"} ${String(form.get("title") || file.name)}.`);
  return listLibrary();
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json() as { id?: number; action?: string };
  if (!body.id || !["archive", "restore"].includes(body.action || "")) return Response.json({ error: "Invalid action." }, { status: 400 });
  const db = await getDb();
  const status = body.action === "archive" ? "archived" : "active";
  await db.update(internalDocuments).set({ status, updatedAt: new Date().toISOString() }).where(eq(internalDocuments.id, body.id));
  await logActivity(actor, `document.${body.action}`, "internal_document", body.id, `${body.action === "archive" ? "Archived" : "Restored"} an internal document.`);
  return listLibrary();
}
