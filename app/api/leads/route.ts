import { desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import {
  billingDocuments,
  businessSettings,
  calendarEvents,
  clientAccounts,
  clientForms,
  clientPasswords,
  clientProjects,
  fileRequests,
  formEvents,
  leads,
  payments,
  projectFiles,
  projectMessages,
  projectTasks,
  projectUpdates,
  testAccessSessions,
} from "@/db/schema";

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const data = await db.select().from(leads).orderBy(desc(leads.createdAt));
  if (!["employee", "support"].includes(actor.role)) return NextResponse.json({ leads: data });
  if (!actor.employeeId) return NextResponse.json({ leads: [] });
  const [projects, tasks] = await Promise.all([
    db.select().from(clientProjects),
    db.select().from(projectTasks).where(eq(projectTasks.assignedEmployeeId, actor.employeeId)),
  ]);
  const projectIds = new Set(tasks.map(task => task.projectId));
  const leadIds = new Set(projects.filter(project => projectIds.has(project.id)).map(project => project.leadId));
  return NextResponse.json({ leads: data.filter(lead => leadIds.has(lead.id)) });
}

export async function POST(request: NextRequest) {
  const actor = await requireAccess(["owner", "admin", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const name = String(body.name || "").trim().slice(0, 160);
  const business = String(body.business || "").trim().slice(0, 200) || name;
  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  const serviceId = String(body.serviceId || "").trim();
  const [settings] = await (await getDb()).select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1);
  let catalog: Array<{id:string;name:string;priceCents:number;active:boolean}> = [];
  try { catalog = JSON.parse(settings?.serviceCatalogJson || "[]"); } catch { catalog = []; }
  if (!catalog.length) catalog = [
    { id: "starter-site", name: "Starter Site", priceCents: 149500, active: true },
    { id: "business-site", name: "Business Site", priceCents: 249500, active: true },
    { id: "online-store", name: "Online Store", priceCents: 349500, active: true },
    { id: "essential-care", name: "Essential Care", priceCents: 9900, active: true },
    { id: "growth-care", name: "Growth Care", priceCents: 19900, active: true },
  ];
  const selectedService = catalog.find(item => item.id === serviceId && item.active !== false);
  const isCustom = serviceId === "custom";
  if (isCustom && !["owner", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Only an Owner or Admin can create custom-priced work." }, { status: 403 });
  }
  if (!isCustom && !selectedService) {
    return NextResponse.json({ error: "Choose an active service from the service catalog." }, { status: 400 });
  }
  const project = (isCustom ? String(body.customServiceName || "").trim() : selectedService?.name || "").slice(0, 240);
  const estimatedValue = isCustom
    ? Math.max(0, Math.min(10000000, Number(body.estimatedValue) || 0))
    : Math.round((selectedService?.priceCents || 0) / 100);
  if (!name || !email || !project || !email.includes("@")) {
    return NextResponse.json({ error: "Contact name, valid email, and project or service are required." }, { status: 400 });
  }

  const allowedStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const status = allowedStatuses.includes(body.status) ? body.status : "new";
  const now = new Date().toISOString();
  const db = await getDb();
  const result = await db.insert(leads).values({
    name,
    business,
    email,
    phone: String(body.phone || "").trim().slice(0, 50),
    project,
    budget: String(body.budget || "").trim().slice(0, 120),
    timeline: String(body.timeline || "").trim().slice(0, 120),
    referral: String(body.referral || "Manual entry").trim().slice(0, 160),
    message: String(body.message || "").trim().slice(0, 12000),
    status,
    estimatedValue,
    nextFollowUp: String(body.nextFollowUp || "").slice(0, 10) || null,
    notes: String(body.notes || "").trim().slice(0, 12000),
    createdAt: now,
    updatedAt: now,
  }).returning();
  await logActivity(actor, "customer.created", "lead", result[0].id, `Created customer record for ${business}.`);
  return NextResponse.json({ lead: result[0] }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const actor = await requireAccess(["owner", "admin", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid lead" }, { status: 400 });

  const allowedStatuses = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const status = allowedStatuses.includes(body.status) ? body.status : "new";
  const estimatedValue = Math.max(0, Math.min(10000000, Number(body.estimatedValue) || 0));
  const now = new Date().toISOString();
  const db = await getDb();
  await db.update(leads).set({
    status,
    estimatedValue,
    nextFollowUp: String(body.nextFollowUp || "").slice(0, 10) || null,
    notes: String(body.notes || "").trim().slice(0, 12000),
    updatedAt: now,
  }).where(eq(leads.id, id));
  await logActivity(actor, "customer.updated", "lead", id, `Updated customer #${id}.`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "Invalid customer." }, { status: 400 });

  const db = await getDb();
  const [customer] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!customer) return NextResponse.json({ error: "That customer no longer exists." }, { status: 404 });

  const [projects, forms, documents, accounts] = await Promise.all([
    db.select({ id: clientProjects.id }).from(clientProjects).where(eq(clientProjects.leadId, id)),
    db.select({ id: clientForms.id }).from(clientForms).where(eq(clientForms.leadId, id)),
    db.select({ id: billingDocuments.id }).from(billingDocuments).where(eq(billingDocuments.leadId, id)),
    db.select({ id: clientAccounts.id }).from(clientAccounts).where(eq(clientAccounts.leadId, id)),
  ]);
  const projectIds = projects.map(item => item.id);
  const formIds = forms.map(item => item.id);
  const documentIds = documents.map(item => item.id);
  const accountIds = accounts.map(item => item.id);
  const files = projectIds.length
    ? await db.select({ storageKey: projectFiles.storageKey }).from(projectFiles).where(inArray(projectFiles.projectId, projectIds))
    : [];

  const statements = [];
  if (documentIds.length) statements.push(db.delete(payments).where(inArray(payments.billingDocumentId, documentIds)));
  if (formIds.length) statements.push(db.delete(formEvents).where(inArray(formEvents.formId, formIds)));
  if (accountIds.length) statements.push(db.delete(clientPasswords).where(inArray(clientPasswords.clientAccountId, accountIds)));
  if (projectIds.length) {
    statements.push(
      db.delete(projectFiles).where(inArray(projectFiles.projectId, projectIds)),
      db.delete(fileRequests).where(inArray(fileRequests.projectId, projectIds)),
      db.delete(projectMessages).where(inArray(projectMessages.projectId, projectIds)),
      db.delete(projectUpdates).where(inArray(projectUpdates.projectId, projectIds)),
      db.delete(projectTasks).where(inArray(projectTasks.projectId, projectIds)),
    );
  }
  statements.push(
    db.delete(calendarEvents).where(eq(calendarEvents.leadId, id)),
    db.delete(testAccessSessions).where(eq(testAccessSessions.leadId, id)),
    db.delete(clientForms).where(eq(clientForms.leadId, id)),
    db.delete(clientAccounts).where(eq(clientAccounts.leadId, id)),
    db.delete(billingDocuments).where(eq(billingDocuments.leadId, id)),
    db.delete(clientProjects).where(eq(clientProjects.leadId, id)),
    db.delete(leads).where(eq(leads.id, id)),
  );

  await db.batch(statements as [typeof statements[number], ...typeof statements]);

  if (files.length) {
    try {
      const { env } = await import("cloudflare:workers");
      await env.BUCKET.delete(files.map(file => file.storageKey));
    } catch (error) {
      console.error("Customer deleted, but stored project files could not be removed.", error);
    }
  }

  await logActivity(actor, "customer.deleted", "lead", id, `Deleted customer ${customer.business || customer.name} and all connected records.`);
  return NextResponse.json({ ok: true, id });
}
