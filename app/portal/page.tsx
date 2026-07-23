import { getChatGPTUser } from "@/app/chatgpt-auth";
import { redirect } from "next/navigation";
import ClientPortal from "./portal-client";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const params = await searchParams;
  const project = Number(params.project);
  const user = await getChatGPTUser();
  if (!user) redirect(project ? `/client-login?project=${project}` : "/client-login");
  return <ClientPortal initialLeadId={project || null} />;
}
