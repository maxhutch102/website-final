import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function LoginPage() {
  const user = await getChatGPTUser();

  return <main className="employee-login-shell">
    <section className="employee-login-card">
      <Link href="/" className="employee-login-brand">
        <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" />
        <span>EMPLOYEE PORTAL</span>
      </Link>
      <div className="employee-login-copy">
        <p className="crm-eyebrow">AUTHORIZED ACCESS ONLY</p>
        <h1>{user ? "Welcome back." : "Sign in to your workspace."}</h1>
        <p>Customer information, project notes, follow-ups, and internal records are protected inside the Pixel Hutch employee workspace.</p>
      </div>
      {user ? <Link className="crm-primary-button login-action" href="/crm">Open CRM</Link> :
        <a className="crm-primary-button login-action" href={chatGPTSignInPath("/crm")}>Continue securely</a>}
      <p className="employee-login-help">Need access? Contact the Pixel Hutch administrator. Employee accounts are approved individually.</p>
      <Link className="login-switch-link" href="/client-login">Pixel Hutch client? Use the Client Portal login →</Link>
    </section>
    <aside className="employee-login-aside" aria-hidden="true">
      <div className="login-grid-mark"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <p>SECURE<br />BY DESIGN</p>
    </aside>
  </main>;
}
