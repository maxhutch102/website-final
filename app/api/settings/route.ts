import { getDb } from "@/db";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { businessSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const defaultServiceCatalogJson = JSON.stringify([
  { id: "starter-site", name: "Starter Site", priceCents: 149500, active: true },
  { id: "business-site", name: "Business Site", priceCents: 249500, active: true },
  { id: "online-store", name: "Online Store", priceCents: 349500, active: true },
  { id: "essential-care", name: "Essential Care", priceCents: 9900, active: true },
  { id: "growth-care", name: "Growth Care", priceCents: 19900, active: true }
]);

const defaults = {
  id: 1,
  companyName: "Pixel Hutch",
  legalName: "Hutch & Son's LLC",
  supportEmail: "max@pixel-hutch.com",
  phone: "",
  website: "https://pixel-hutch.com",
  address: "Phoenix, Arizona",
  timezone: "America/Phoenix",
  currency: "USD",
  estimatePrefix: "EST",
  invoicePrefix: "INV",
  paymentTermsDays: 14,
  defaultTaxRate: 0,
  defaultDepositPercent: 50,
  estimateExpirationDays: 30,
  taskReminderDays: 2,
  invoiceReminderDays: 3,
  notifyNewLeads: true,
  notifyClientMessages: true,
  notifyOverdueInvoices: true,
  clientShowProgress: true,
  clientShowTasks: true,
  clientAllowUploads: true,
  clientAllowMessages: true,
  serviceCatalogJson: defaultServiceCatalogJson,
  accentColor: "#f54702",
  updatedBy: "system",
  updatedAt: new Date().toISOString(),
};

async function loadSettings() {
  const db = await getDb();
  const current = (await db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1))[0];
  if (current) {
    if (!current.serviceCatalogJson || current.serviceCatalogJson === "[]") {
      await db.update(businessSettings).set({ serviceCatalogJson: defaultServiceCatalogJson }).where(eq(businessSettings.id, 1));
      return { ...current, serviceCatalogJson: defaultServiceCatalogJson };
    }
    return current;
  }
  await db.insert(businessSettings).values(defaults);
  return defaults;
}

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  return Response.json({ settings: await loadSettings(), canManage: ["owner", "admin"].includes(actor.role) });
}

export async function PATCH(request: Request) {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
  const number = (value: unknown, fallback: number, min = 0, max = 365) =>
    Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : fallback));
  const boolean = (value: unknown) => value === true;
  const prefix = (value: unknown, fallback: string) =>
    text(value, fallback).toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) || fallback;
  const accentColor = /^#[0-9a-f]{6}$/i.test(text(body.accentColor)) ? text(body.accentColor) : "#f54702";
  let serviceCatalog: Array<{id:string;name:string;priceCents:number;active:boolean}> = [];
  try {
    const candidate = typeof body.serviceCatalogJson === "string" ? JSON.parse(body.serviceCatalogJson) : body.serviceCatalogJson;
    if (!Array.isArray(candidate)) throw new Error("invalid");
    serviceCatalog = candidate.slice(0, 100).map((item, index) => ({
      id: text(item?.id, `service-${index + 1}`).toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 80) || `service-${index + 1}`,
      name: text(item?.name).slice(0, 160),
      priceCents: Math.round(number(item?.priceCents, 0, 0, 100000000)),
      active: item?.active !== false,
    })).filter(item => item.name);
  } catch {
    return Response.json({ error: "The service catalog contains invalid data." }, { status: 400 });
  }
  if (!text(body.companyName) || !text(body.supportEmail)) {
    return Response.json({ error: "Company name and support email are required." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const values = {
    companyName: text(body.companyName),
    legalName: text(body.legalName),
    supportEmail: text(body.supportEmail).toLowerCase(),
    phone: text(body.phone),
    website: text(body.website),
    address: text(body.address),
    timezone: text(body.timezone, "America/Phoenix"),
    currency: text(body.currency, "USD"),
    estimatePrefix: prefix(body.estimatePrefix, "EST"),
    invoicePrefix: prefix(body.invoicePrefix, "INV"),
    paymentTermsDays: number(body.paymentTermsDays, 14),
    defaultTaxRate: Math.round(number(body.defaultTaxRate, 0, 0, 100) * 100),
    defaultDepositPercent: number(body.defaultDepositPercent, 50, 0, 100),
    estimateExpirationDays: number(body.estimateExpirationDays, 30),
    taskReminderDays: number(body.taskReminderDays, 2, 0, 30),
    invoiceReminderDays: number(body.invoiceReminderDays, 3, 0, 30),
    notifyNewLeads: boolean(body.notifyNewLeads),
    notifyClientMessages: boolean(body.notifyClientMessages),
    notifyOverdueInvoices: boolean(body.notifyOverdueInvoices),
    clientShowProgress: boolean(body.clientShowProgress),
    clientShowTasks: boolean(body.clientShowTasks),
    clientAllowUploads: boolean(body.clientAllowUploads),
    clientAllowMessages: boolean(body.clientAllowMessages),
    serviceCatalogJson: JSON.stringify(serviceCatalog),
    accentColor,
    updatedBy: actor.email,
    updatedAt: now,
  };
  const db = await getDb();
  await loadSettings();
  await db.update(businessSettings).set(values).where(eq(businessSettings.id, 1));
  await logActivity(actor, "settings.updated", "settings", 1, "Updated Business Hub company and workflow settings.");
  return Response.json({ settings: (await db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1))[0], canManage: true });
}
