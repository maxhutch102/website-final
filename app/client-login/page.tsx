import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const user = await getChatGPTUser();
  const params = await searchParams;
  const project = Number(params.project);
  const portalPath = Number.isFinite(project) && project > 0
    ? `/portal?project=${project}`
    : "/portal";

  return <main className="employee-login-shell client-login-shell">
    <section className="employee-login-card client-login-card">
      <Link href="/" className="employee-login-brand">
        <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" />
        <span>CLIENT PORTAL</span>
      </Link>
      <div className="employee-login-copy">
        <p className="crm-eyebrow">YOUR PROJECT, ALL IN ONE PLACE</p>
        <h1>{user ? "Welcome back." : "Let’s get you connected."}</h1>
        <p>Review your project, approve estimates, view invoices, share files, and message the Pixel Hutch team from your private client workspace.</p>
      </div>
      {user
        ? <Link className="crm-primary-button login-action" href={portalPath}>Open client portal</Link>
        : <a className="crm-primary-button login-action" href={chatGPTSignInPath(portalPath)}>Sign in to your portal</a>}
      <p className="employee-login-help">Use the email address connected to your Pixel Hutch customer account. Need help? Contact your Pixel Hutch representative.</p>
      <Link className="login-switch-link" href="/login">Pixel Hutch employee? Use the Business Hub login →</Link>
    </section>
    <aside className="employee-login-aside client-login-aside" aria-hidden="true">
      <div className="client-login-status">
        <span>YOUR WORKSPACE</span>
        <b>Projects.<br />Files.<br />Answers.</b>
        <small>Everything connected. Nothing buried.</small>
      </div>
      <div className="login-grid-mark"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
    </aside>
  </main>;
}
