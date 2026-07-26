import Link from "next/link";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ClientLoginPage({
  searchParams,
}: {
    searchParams: Promise<{ project?: string; sent?: string; error?: string; email?: string }>;
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
        : params.sent
          ? <p className="auth-success">If that email belongs to an active client account, a password-reset link is on its way.</p>
          : <form className="auth-form" action="/api/auth/client-login" method="post">
              <input type="hidden" name="returnTo" value={portalPath} />
              <label>Email address<input name="email" type="email" autoComplete="email" defaultValue={params.email || ""} required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
              <button className="crm-primary-button login-action">Sign in to client portal</button>
            </form>}
      {!user && !params.sent && <form className="client-password-reset" action="/api/auth/request-link" method="post">
        <input type="hidden" name="type" value="client-password-reset" />
        <input type="hidden" name="returnTo" value={portalPath} />
        <label>Forgot your password?
          <span className="client-reset-row">
            <input name="email" type="email" autoComplete="email" placeholder="Email address" required />
            <button type="submit">Send reset link</button>
          </span>
        </label>
      </form>}
      {params.error === "invalid" && <p className="auth-error">That email and password combination is not valid.</p>}
      {params.error === "expired" && <p className="auth-error">That link expired or was already used. Request another one.</p>}
      {params.error === "account" && <p className="auth-error">We could not find the client account connected to that invitation.</p>}
      <p className="employee-login-help">Use the email address connected to your Pixel Hutch customer account. Need help? Contact your Pixel Hutch representative.</p>
          <Link className="login-switch-link" href="/login">Pixel Hutch employee? Use the Business Hutch login →</Link>
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
