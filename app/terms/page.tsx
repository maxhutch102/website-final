import SiteFooter from "../site-footer";
import SiteHeader from "../site-header";

export const metadata = {
  title: "Website Terms | Pixel Hutch",
  description: "Terms governing use of the Pixel Hutch public website.",
};

export default function TermsPage() {
  return <main>
    <SiteHeader />
    <article className="legal-page section-shell">
      <header><p className="kicker">WEBSITE TERMS</p><h1>USEFUL.<br />FAIR.<br />CLEAR.</h1><p className="legal-updated">Effective July 23, 2026</p></header>
      <div className="legal-content">
        <section><h2>Using this website</h2><p>You may use this website to learn about Pixel Hutch and contact us about potential services. Do not attempt to disrupt the site, gain unauthorized access, scrape protected information, or use the site for unlawful activity.</p></section>
        <section><h2>Information and estimates</h2><p>Website content is general information, not a binding offer. Package prices are starting points and may change based on scope. A project begins only after both parties agree to a written proposal or service agreement.</p></section>
        <section><h2>Ownership</h2><p>Pixel Hutch owns the website&apos;s original branding, design, text, and code unless stated otherwise. Client ownership, licenses, third-party services, and handoff terms are defined in the applicable project agreement.</p></section>
        <section><h2>Third-party services</h2><p>Links and integrations may lead to services operated by others. Pixel Hutch is not responsible for third-party availability, content, security, pricing, or policies.</p></section>
        <section><h2>No guarantee of uninterrupted access</h2><p>We work to keep the website reliable, but it may occasionally be unavailable or contain an error. To the extent allowed by law, the public website is provided without guarantees of uninterrupted availability or fitness for a particular purpose.</p></section>
        <section><h2>Contact</h2><p>Questions about these terms can be sent to <a href="mailto:max@pixel-hutch.com">max@pixel-hutch.com</a>.</p></section>
      </div>
    </article>
    <SiteFooter />
  </main>;
}
