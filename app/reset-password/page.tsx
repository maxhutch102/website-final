import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  if (!params.token) return <main className="employee-login-shell"><section className="employee-login-card">
    <h1>That reset link is incomplete.</h1><Link href="/forgot-password">Request a new link</Link>
  </section></main>;
  return <main className="employee-login-shell">
    <section className="employee-login-card">
      <Link href="/" className="employee-login-brand"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /><span>NEW PASSWORD</span></Link>
      <div className="employee-login-copy">
        <p className="crm-eyebrow">SECURE ACCOUNT SETUP</p>
        <h1>Choose your password.</h1>
        <p>Use at least 12 characters with an uppercase letter, lowercase letter, and number.</p>
      </div>
      <form className="auth-form" action="/api/auth/reset-password" method="post">
        <input type="hidden" name="token" value={params.token} />
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required /></label>
        <button className="crm-primary-button login-action">Save password and sign in</button>
      </form>
      {params.error === "match" && <p className="auth-error">Those passwords do not match.</p>}
      {params.error === "rules" && <p className="auth-error">Use 12+ characters with uppercase, lowercase, and a number.</p>}
    </section>
    <aside className="employee-login-aside" aria-hidden="true"><p>YOUR<br />BUSINESS.<br />PROTECTED.</p></aside>
  </main>;
}
