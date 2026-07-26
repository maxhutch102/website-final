import { sendClientFormEmail } from "@/app/client-email";
import { formTemplateSeeds, type FormField } from "@/app/form-templates";
import { getDb } from "@/db";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { clientForms, clientProjects, formEvents, formTemplates, leads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parseFields(value: string): FormField[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cleanValues(fields: FormField[], input: unknown) {
  const source = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const result: Record<string, string | boolean> = {};
  for (const field of fields) {
    result[field.id] = field.type === "checkbox"
      ? Boolean(source[field.id])
      : String(source[field.id] ?? "").slice(0, field.type === "textarea" ? 12000 : 1000);
  }
  return result;
}

async function ensureTemplates(db: Awaited<ReturnType<typeof getDb>>) {
  const existing = await db.select().from(formTemplates);
  const existingSlugs = new Set(existing.map(template => template.slug));
  const now = new Date().toISOString();
  for (const seed of formTemplateSeeds) {
    if (!existingSlugs.has(seed.slug)) {
      await db.insert(formTemplates).values({
        slug: seed.slug, name: seed.name, description: seed.description, category: seed.category,
        schemaJson: JSON.stringify(seed.fields), customerFacing: seed.customerFacing,
        requiresSignature: Boolean(seed.requiresSignature), createdAt: now, updatedAt: now,
      });
    }
  }
}

export async function GET() {
  const actor = await requireAccess(["owner", "admin", "manager", "sales", "support"]);
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  await ensureTemplates(db);
  const [templates, forms, customers, projects, events] = await Promise.all([
    db.select().from(formTemplates).orderBy(formTemplates.category, formTemplates.name),
    db.select().from(clientForms).orderBy(desc(clientForms.updatedAt)),
    db.select().from(leads).orderBy(leads.business),
    db.select().from(clientProjects),
    db.select().from(formEvents).orderBy(desc(formEvents.createdAt)),
  ]);
  return Response.json({ templates, forms, customers, projects, events, actor });
}

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin", "manager", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const db = await getDb();
  await ensureTemplates(db);
  const templateId = Number(body.templateId);
  const leadId = Number(body.leadId);
  const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, templateId)).limit(1);
  const [customer] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!template || !customer) return Response.json({ error: "Choose a valid template and customer." }, { status: 400 });
  const [project] = await db.select().from(clientProjects).where(eq(clientProjects.leadId, leadId)).limit(1);
  const now = new Date().toISOString();
  const [saved] = await db.insert(clientForms).values({
    templateId, leadId, projectId: project?.id || null,
    title: String(body.title || template.name).trim().slice(0, 200) || template.name,
    valuesJson: JSON.stringify(cleanValues(parseFields(template.schemaJson), body.values)),
    dueDate: body.dueDate || null, customerCanEdit: body.customerCanEdit !== false,
    customerVisible: false, createdBy: actor.email, updatedBy: actor.email, createdAt: now, updatedAt: now,
  }).returning();
  await db.insert(formEvents).values({
    formId: saved.id, eventType: "created", actorEmail: actor.email, actorName: actor.name,
    note: `Created from ${template.name}.`, createdAt: now,
  });
  await logActivity(actor, "form.created", "client_form", saved.id, `Created ${saved.title} for ${customer.business}.`);
  return Response.json({ form: saved });
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin", "manager", "sales", "support"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const id = Number(body.id);
  const db = await getDb();
  const [current] = await db.select().from(clientForms).where(eq(clientForms.id, id)).limit(1);
  if (!current) return Response.json({ error: "Form not found." }, { status: 404 });
  const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, current.templateId)).limit(1);
  const [customer] = await db.select().from(leads).where(eq(leads.id, current.leadId)).limit(1);
  if (!template || !customer) return Response.json({ error: "The form is missing its template or customer." }, { status: 409 });
  const now = new Date().toISOString();
  const action = String(body.action || "save");
  const nextStatus = action === "send" ? "sent" : action === "archive" ? "archived" : String(body.status || current.status);
  const notify = action === "send" || action === "saveAndNotify";
  const patch = {
    title: String(body.title || current.title).trim().slice(0, 200),
    valuesJson: body.values ? JSON.stringify(cleanValues(parseFields(template.schemaJson), body.values)) : current.valuesJson,
    dueDate: body.dueDate === undefined ? current.dueDate : (body.dueDate || null),
    customerCanEdit: body.customerCanEdit === undefined ? current.customerCanEdit : body.customerCanEdit !== false,
    customerVisible: action === "send" ? true : current.customerVisible,
    status: nextStatus,
    revision: action === "save" || action === "saveAndNotify" ? current.revision + 1 : current.revision,
    updatedBy: actor.email, updatedAt: now, lastNotifiedAt: notify ? now : current.lastNotifiedAt,
  };
  const [saved] = await db.update(clientForms).set(patch).where(eq(clientForms.id, id)).returning();
  let emailWarning = "";
  if (notify) {
    try {
      await sendClientFormEmail(request, {
        to: customer.email, customerName: customer.name, businessName: customer.business,
        formTitle: saved.title, leadId: customer.id, message: String(body.message || "").slice(0, 1000),
        action: action === "send" ? "requested" : "updated",
      });
    } catch (error) {
      console.error("Client form notification failed", error);
      emailWarning = "The form was saved, but the customer email could not be sent.";
    }
  }
  await db.insert(formEvents).values({
    formId: id, eventType: action, actorEmail: actor.email, actorName: actor.name,
    note: notify ? (emailWarning || `Notification sent to ${customer.email}.`) : "Form updated without customer email.",
    createdAt: now,
  });
  await logActivity(actor, `form.${action}`, "client_form", id, `${action} ${saved.title} for ${customer.business}.`);
  return Response.json({ form: saved, warning: emailWarning });
}
