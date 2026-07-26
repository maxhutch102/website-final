import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function CreateClientPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (!params.token) return <main className="employee-login-shell"><section className="employee-login-card">
    <h1>That account link is incomplete.</h1>
    <Link href="/client-login">Return to client login</Link>
  </section></main>;
  return <main className="employee-login-shell client-login-shell">
    <section className="employee-login-card client-login-card">
      <Link href="/" className="employee-login-brand">
        <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><span>CLIENT ACCOUNT</span>
      </Link>
      <div className="employee-login-copy">
        <p className="crm-eyebrow">SECURE ACCOUNT SETUP</p>
        <h1>Create your password.</h1>
        <p>Use at least 12 characters with an uppercase letter, lowercase letter, and number.</p>
      </div>
      <form className="auth-form" action="/api/auth/client-password" method="post">
        <input type="hidden" name="token" value={params.token} />
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
        <button className="crm-primary-button login-action">Create password and open portal</button>
      </form>
      {params.error === "match" && <p className="auth-error">Those passwords do not match.</p>}
      {params.error === "rules" && <p className="auth-error">Use 12+ characters with uppercase, lowercase, and a number.</p>}
    </section>
    <aside className="employee-login-aside client-login-aside" aria-hidden="true">
      <div className="client-login-status"><span>YOUR WORKSPACE</span><b>Projects.<br />Files.<br />Answers.</b></div>
    </aside>
  </main>;
}
