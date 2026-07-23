import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { businessSettings, clientProjects, leads, projectTasks } from "@/db/schema";

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
