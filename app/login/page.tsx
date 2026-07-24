import Link from "next/link";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; email?: string; returnTo?: string }> }) {
  const user = await getChatGPTUser();
  const params = await searchParams;

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
      {user ? <Link className="crm-primary-button login-action" href="/crm">Open Business Hutch</Link> :
        <form className="auth-form" action="/api/auth/employee-login" method="post">
          <input type="hidden" name="returnTo" value={params.returnTo || "/crm"} />
          <label>Email address<input name="email" type="email" autoComplete="username" defaultValue={params.email || ""} required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          {params.error && <p className="auth-error">That email or password was not recognized.</p>}
          <button className="crm-primary-button login-action">Sign in securely</button>
          <Link className="auth-recovery-link" href="/forgot-password">Forgot email or password?</Link>
        </form>}
      <p className="employee-login-help">Need access? Contact the Pixel Hutch administrator. Employee accounts are approved individually.</p>
      <Link className="login-switch-link" href="/client-login">Pixel Hutch client? Use the Client Portal login →</Link>
    </section>
    <aside className="employee-login-aside" aria-hidden="true">
      <div className="login-grid-mark"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <p>SECURE<br />BY DESIGN</p>
    </aside>
  </main>;
}
