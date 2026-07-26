import { createEmailToken } from "@/app/auth-email";
import { sendClientWelcomeEmail } from "@/app/client-welcome-email";
import { getDb } from "@/db";
import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { clientAccounts, leads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess(["owner", "admin", "manager", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  return Response.json({ accounts: await db.select().from(clientAccounts) });
}

export async function POST(request: Request) {
  const actor = await requireAccess(["owner", "admin", "manager", "sales"]);
  if (isAccessResponse(actor)) return actor;
  const body = await request.json();
  const leadId = Number(body.leadId);
  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return Response.json({ error: "Customer not found." }, { status: 404 });
  if (!lead.email.includes("@")) return Response.json({ error: "Add a valid customer email first." }, { status: 400 });
  const now = new Date().toISOString();
  const [existing] = await db.select().from(clientAccounts).where(eq(clientAccounts.leadId, leadId)).limit(1);
  let account;
  if (existing) {
    [account] = await db.update(clientAccounts).set({
      email: lead.email.toLowerCase(), status: "invited", invitedAt: now, updatedAt: now,
    }).where(eq(clientAccounts.id, existing.id)).returning();
  } else {
    [account] = await db.insert(clientAccounts).values({
      leadId, email: lead.email.toLowerCase(), status: "invited", invitedAt: now,
      createdBy: actor.email, createdAt: now, updatedAt: now,
    }).returning();
  }
  try {
    const token = await createEmailToken(lead.email, "client-activation", `/portal?project=${lead.id}`);
    await sendClientWelcomeEmail(request, {
      to: lead.email, customerName: lead.name, businessName: lead.business, leadId: lead.id, token,
    });
  } catch (error) {
    console.error("Client account invitation failed", error);
    return Response.json({ error: "The account was created, but the welcome email could not be sent.", account }, { status: 502 });
  }
  await logActivity(actor, "client.account_invited", "client_account", account.id, `Sent client portal access to ${lead.email}.`);
  return Response.json({ account, message: `Portal invitation sent to ${lead.email}.` });
}
