import { requireChatGPTUser } from "@/app/chatgpt-auth";
import CrmDashboard from "./crm-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function CrmPage() {
  const user = await requireChatGPTUser("/crm");
  return <CrmDashboard displayName={user.fullName || "Max"} />;
}
