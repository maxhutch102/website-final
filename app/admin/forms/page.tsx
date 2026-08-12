import { requireChatGPTUser } from "@/app/chatgpt-auth";
import Link from "next/link";
import FormsWorkspace from "./forms-workspace";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function FormsPage() {
  await requireChatGPTUser("/admin/forms");
  return <main className="forms-page">
    <header className="forms-topbar">
      <Link href="/admin"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><span>BUSINESS HUTCH</span></Link>
      <div><Link href="/admin">← Business Hutch</Link><a href="/api/auth/logout?returnTo=/login">Sign out</a></div>
    </header>
    <FormsWorkspace />
  </main>;
}
