import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import CrmDashboard from "../crm-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const sections = new Set([
  "customers",
  "projects",
  "tasks",
  "employees",
  "timecards",
  "documents",
  "library",
  "calendar",
  "billing",
  "messages",
  "reports",
  "activity",
  "settings",
]);

export default async function CrmSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.has(section)) notFound();

  const user = await requireChatGPTUser(`/crm/${section}`);
  return <CrmDashboard displayName={user.fullName || "Max"} initialView={section} />;
}
