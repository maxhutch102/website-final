import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <main className="employee-login-shell">
    <section className="employee-login-card">
      <Link href="/" className="employee-login-brand">
        <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" />
        <span>ACCOUNT RECOVERY</span>
      </Link>
      <div className="employee-login-copy">
        <p className="crm-eyebrow">BUSINESS HUTCH ACCESS</p>
        <h1>{params.sent ? "Check your email." : "Recover your account."}</h1>
        <p>{params.sent
          ? "If that email belongs to an active account, a secure password link is on its way."
          : "Your login name is your approved work email. Enter it below to set or reset your password."}</p>
      </div>
      {!params.sent && <form className="auth-form" action="/api/auth/request-link" method="post">
        <input type="hidden" name="type" value="password-reset" />
        <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
        <button className="crm-primary-button login-action">Email me a secure reset link</button>
      </form>}
      {params.error === "expired" && <p className="auth-error">That link expired or was already used. Request a new one.</p>}
      <Link className="login-switch-link" href="/login">← Return to Business Hutch login</Link>
    </section>
    <aside className="employee-login-aside" aria-hidden="true"><p>SECURE<br />BY DESIGN</p></aside>
  </main>;
}
