import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { activityLogs, employees, leads, testAccessSessions } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const allowedRoles = new Set(["admin", "manager", "sales", "support", "employee"]);

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function requireOwner() {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const email = user.email.toLowerCase();
  const db = await getDb();
  const [employee] = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
  const role = employee?.role || (email === "mhutchi2517@gmail.com" ? "owner" : "");
  if (role !== "owner") return { error: Response.json({ error: "Only the Owner can use Test Mode." }, { status: 403 }) };
  return { user, email, db };
}

export async function GET() {
  const access = await requireOwner();
  if ("error" in access) return access.error;
  const token = (await cookies()).get("ph_test_access")?.value;
  let session = null;
  if (token) {
    [session] = await access.db.select().from(testAccessSessions).where(and(
      eq(testAccessSessions.tokenHash, await hashToken(token)),
      eq(testAccessSessions.ownerEmail, access.email),
      gt(testAccessSessions.expiresAt, new Date().toISOString()),
    )).limit(1);
  }
  return Response.json({ session: session || null });
}

export async function POST(request: Request) {
  const access = await requireOwner();
  if ("error" in access) return access.error;
  const input = await request.json();
  const mode = String(input.mode || "");
  const role = mode === "role" ? String(input.role || "") : null;
  const leadId = mode === "client" ? Number(input.leadId) : null;
  if (mode === "role" && !allowedRoles.has(role || "")) return Response.json({ error: "Choose a valid test role." }, { status: 400 });
  if (mode === "client") {
    if (!leadId) return Response.json({ error: "Choose a customer for the test client." }, { status: 400 });
    const [lead] = await access.db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return Response.json({ error: "Customer not found." }, { status: 404 });
  }
  if (!["role", "client"].includes(mode)) return Response.json({ error: "Choose a valid test mode." }, { status: 400 });

  const token = crypto.randomUUID() + crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  await access.db.insert(testAccessSessions).values({
    tokenHash: await hashToken(token), ownerEmail: access.email, mode, role, leadId,
    createdAt: now.toISOString(), expiresAt: expires.toISOString(),
  });
  await access.db.insert(activityLogs).values({
    actorEmail: access.email, actorName: access.user.displayName, actorRole: "owner",
    action: "test_mode.started", entityType: mode, entityId: String(leadId || role || ""),
    summary: mode === "client" ? `Started a test-client session for customer #${leadId}.` : `Started View as ${role}.`,
    createdAt: now.toISOString(),
  });
  (await cookies()).set("ph_test_access", token, {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", expires,
  });
  return Response.json({ ok: true, mode, role, leadId });
}

export async function DELETE() {
  const access = await requireOwner();
  if ("error" in access) return access.error;
  const cookieStore = await cookies();
  const token = cookieStore.get("ph_test_access")?.value;
  if (token) await access.db.delete(testAccessSessions).where(eq(testAccessSessions.tokenHash, await hashToken(token)));
  cookieStore.delete("ph_test_access");
  await access.db.insert(activityLogs).values({
    actorEmail: access.email, actorName: access.user.displayName, actorRole: "owner",
    action: "test_mode.ended", entityType: "session", entityId: "",
    summary: "Returned to the Owner account from Test Mode.", createdAt: new Date().toISOString(),
  });
  return Response.json({ ok: true });
}
