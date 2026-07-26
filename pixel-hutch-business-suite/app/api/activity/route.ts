import { isAccessResponse, requireAccess } from "@/db/access";
import { getDb } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireAccess(["owner", "admin"]);
  if (isAccessResponse(actor)) return actor;
  const db = await getDb();
  return Response.json({ activity: await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(200) });
}
