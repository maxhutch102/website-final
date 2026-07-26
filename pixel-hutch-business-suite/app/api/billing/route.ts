import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { billingDocuments, businessSettings, clientProjects, leads, payments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type LineItem = { serviceId: string; description: string; quantity: number; rateCents: number };
type ServiceCatalogItem = { id: string; name: string; priceCents: number; active: boolean };

function totals(items: LineItem[], discountCents = 0, taxRate = 0) {
  const subtotalCents = items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.rateCents), 0);
  const taxable = Math.max(0, subtotalCents - Math.max(0, discountCents));
  const taxCents = Math.round(taxable * Math.max(0, taxRate) / 100);
  return { subtotalCents, taxCents, totalCents: taxable + taxCents };
}

function nextDocumentNumber(
  documents: Array<{ number: string }>,
  prefix: string,
  year = new Date().getFullYear(),
) {
  const stem = `${prefix}-${year}-`;
  const highestSequence = documents.reduce((highest, document) => {
    if (!document.number.startsWith(stem)) return highest;
    const sequence = Number(document.number.slice(stem.length));
    return Number.isInteger(sequence) && sequence > highest ? sequence : highest;
  }, 0);
  return `${stem}${String(highestSequence + 1).padStart(4, "0")}`;
}

export async function GET() {
  const actor = await requireAccess(["owner", "admin", "manager", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  return Response.json({
    documents: await db.select().from(billingDocuments).orderBy(desc(billingDocuments.createdAt)),
    payments: await db.select().from(payments).orderBy(desc(payments.paidAt)),
  });
}

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin", "manager", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const db = await getDb();
  const now = new Date().toISOString();

  if (body.action === "payment") {
    const documentId = Number(body.billingDocumentId);
    const amountCents = Math.round(Number(body.amount || 0) * 100);
    if (!documentId || amountCents <= 0) return Response.json({ error: "Enter a valid payment amount." }, { status: 400 });
    const current = (await db.select().from(billingDocuments).where(eq(billingDocuments.id, documentId)).limit(1))[0];
    if (!current) return Response.json({ error: "Invoice not found." }, { status: 404 });
    await db.insert(payments).values({ billingDocumentId: documentId, amountCents, method: body.method || "other", reference: body.reference || "", paidAt: body.paidAt || now, recordedBy: actor.email, createdAt: now });
    const paidCents = Math.min(current.totalCents, current.paidCents + amountCents);
    await db.update(billingDocuments).set({ paidCents, status: paidCents >= current.totalCents ? "paid" : "partial", updatedAt: now }).where(eq(billingDocuments.id, documentId));
    await logActivity(actor, "billing.payment_recorded", "billing", documentId, `Recorded a $${(amountCents / 100).toFixed(2)} payment on ${current.number}.`);
  } else {
    const leadId = Number(body.leadId);
    if (!leadId) return Response.json({ error: "Choose an existing customer before creating a billing document." }, { status: 400 });
    const [customer] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!customer) return Response.json({ error: "That customer record no longer exists." }, { status: 404 });
    const kind = body.kind === "invoice" ? "invoice" : "estimate";
    const settings = (await db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1))[0];
    let serviceCatalog: ServiceCatalogItem[] = [];
    try {
      const parsed = JSON.parse(settings?.serviceCatalogJson || "[]");
      if (Array.isArray(parsed)) serviceCatalog = parsed;
    } catch {}
    const requestedItems: LineItem[] = Array.isArray(body.lineItems) ? body.lineItems.slice(0, 100) : [];
    const items: LineItem[] = [];
    for (const requested of requestedItems) {
      const serviceId = String(requested.serviceId || "");
      const quantity = Math.max(1, Math.min(10000, Number(requested.quantity || 1)));
      if (serviceId === "custom") {
        if (!["owner", "admin"].includes(actor.role)) {
          return Response.json({ error: "Only an Owner or Admin can add custom quote lines or manual pricing." }, { status: 403 });
        }
        const description = String(requested.description || "").trim().slice(0, 500);
        const rateCents = Math.max(0, Math.min(100000000, Math.round(Number(requested.rateCents || 0))));
        if (!description) return Response.json({ error: "Add a description for each custom line." }, { status: 400 });
        items.push({ serviceId, description, quantity, rateCents });
        continue;
      }
      const service = serviceCatalog.find(item => item.id === serviceId && item.active);
      if (!service) return Response.json({ error: "Choose an active service from the service catalog for every line." }, { status: 400 });
      items.push({ serviceId:service.id, description:service.name, quantity, rateCents:service.priceCents });
    }
    if (!items.length) return Response.json({ error: "At least one service line is required." }, { status: 400 });
    const existingDocuments = await db.select({ number: billingDocuments.number }).from(billingDocuments);
    const number = nextDocumentNumber(
      existingDocuments,
      kind === "invoice" ? (settings?.invoicePrefix || "INV") : (settings?.estimatePrefix || "EST"),
    );
    const discountCents = Math.round(Number(body.discount || 0) * 100);
    const taxRate = body.taxRate === "" || body.taxRate == null ? (settings?.defaultTaxRate || 0) / 100 : Number(body.taxRate);
    const calculated = totals(items, discountCents, taxRate);
    const inserted = await db.insert(billingDocuments).values({
      kind, number, leadId: customer.id, customerName: customer.name,
      customerBusiness: customer.business || "", customerEmail: customer.email, status: "draft",
      issueDate: body.issueDate || now.slice(0, 10), dueDate: body.dueDate || null, lineItemsJson: JSON.stringify(items),
      ...calculated, discountCents, recurring: body.recurrence !== "one_time" && Boolean(body.recurring),
      recurrence: body.recurrence === "one_time" ? "one_time" : (body.recurrence || "monthly"),
      notes: body.notes || "", createdBy: actor.email, createdAt: now, updatedAt: now,
    }).returning();
    await logActivity(actor, "billing.created", "billing", inserted[0].id, `Created ${number} for ${customer.business || customer.name}.`);
  }
  return GET();
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin", "manager", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const id = Number(body.id);
  const allowed = ["draft", "sent", "accepted", "declined", "partial", "paid", "overdue", "void"];
  if (!id || !allowed.includes(body.status)) return Response.json({ error: "Invalid billing update." }, { status: 400 });
  if (body.status === "void" && !["owner", "admin"].includes(actor.role)) {
    return Response.json({ error: "Only an owner or administrator can cancel a billing document." }, { status: 403 });
  }
  const db = await getDb();
  const current = (await db.select().from(billingDocuments).where(eq(billingDocuments.id, id)).limit(1))[0];
  if (!current) return Response.json({ error: "Billing document not found." }, { status: 404 });
  if (current.status === "void") return Response.json({ error: "Canceled documents cannot be changed." }, { status: 409 });
  const now = new Date().toISOString();
  let convertedInvoice = null;
  if (current.kind === "estimate" && body.status === "accepted") {
    const settings = (await db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1))[0];
    const existingDocuments = await db.select({ number: billingDocuments.number }).from(billingDocuments);
    const invoiceNumber = nextDocumentNumber(existingDocuments, settings?.invoicePrefix || "INV");
    await db.update(billingDocuments).set({
      kind: "invoice",
      number: invoiceNumber,
      status: "sent",
      issueDate: now.slice(0, 10),
      updatedAt: now,
    }).where(eq(billingDocuments.id, id));
    convertedInvoice = (await db.select().from(billingDocuments).where(eq(billingDocuments.id, id)).limit(1))[0] || null;
    if (!convertedInvoice || convertedInvoice.kind !== "invoice") {
      return Response.json({ error: "The estimate could not be converted. No invoice was created." }, { status: 500 });
    }
    if (current.leadId) {
      const [existingProject] = await db.select().from(clientProjects).where(eq(clientProjects.leadId, current.leadId)).limit(1);
      if (!existingProject) {
        await db.insert(clientProjects).values({
          leadId: current.leadId,
          status: "planning",
          progress: 0,
          currentPhase: "Kickoff & discovery",
          nextStep: "Schedule project kickoff",
          clientSummary: "Your estimate was accepted and your project is ready for kickoff.",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await logActivity(actor, "billing.estimate_converted", "billing", id, `Accepted ${current.number}; converted it to outstanding invoice ${invoiceNumber}.`);
  } else {
    await db.update(billingDocuments).set({ status: body.status, updatedAt: now }).where(eq(billingDocuments.id, id));
    await logActivity(actor, body.status === "void" ? "billing.canceled" : "billing.status_changed", "billing", id, body.status === "void" ? `Canceled ${current.number}.` : `Changed ${current.number} status to ${body.status}.`);
  }
  const documents = await db.select().from(billingDocuments).orderBy(desc(billingDocuments.createdAt));
  return Response.json({
    documents,
    converted: Boolean(convertedInvoice),
    invoice: convertedInvoice,
  });
}
