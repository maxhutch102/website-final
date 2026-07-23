import { isAccessResponse, logActivity, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { timeEntries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess();
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  const recent = actor.employeeId
    ? await db.select().from(timeEntries).where(eq(timeEntries.employeeId, actor.employeeId)).orderBy(desc(timeEntries.clockIn)).limit(1)
    : [];
  const activeEntry = recent[0] && !recent[0].clockOut ? recent[0] : null;
  await logActivity(actor, "session.login", "session", null, "Signed in to the Business Hub.");
  return Response.json({ actor, activeEntry, testMode: actor.testMode });
}
