export const metadata = {
  title: "Privacy Policy | Pixel Hutch",
  description: "How Pixel Hutch collects, uses, and protects information submitted through its website and business services.",
};

export default function PrivacyPage() {
  return <main>
    <header className="site-header">
      <a className="brand" href="/" aria-label="Pixel Hutch home"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /></a>
      <nav aria-label="Primary navigation"><a href="/services">Services &amp; Pricing</a><a href="/work">Our work</a><a href="/#process">Process</a><a href="/about">About</a></nav>
      <a className="button button-small" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
    </header>
    <article className="legal-page section-shell">
      <header><p className="kicker">THE PLAIN-ENGLISH VERSION</p><h1>PRIVACY<br />POLICY.</h1><p className="legal-updated">Effective July 23, 2026</p></header>
      <div className="legal-content">
        <section><h2>What we collect</h2><p>When you contact Pixel Hutch, we may collect your name, business name, email address, phone number, project details, budget range, timeline, and any files or information you choose to provide. Our website may also receive basic technical information needed for security and reliable operation.</p></section>
        <section><h2>How we use it</h2><p>We use your information to respond to inquiries, prepare proposals, provide services, manage projects and billing, improve our website and systems, and protect against misuse. We do not sell your personal information.</p></section>
        <section><h2>Service providers</h2><p>We may use trusted hosting, email, file-storage, analytics, and payment providers to operate our business. They receive only the information needed to provide their services and are subject to their own privacy and security terms.</p></section>
        <section><h2>Business Hub and client portal</h2><p>Information stored in the Pixel Hutch Business Hub is available only to authorized users and the customers connected to the relevant records. Access controls help limit what each user can see, but no internet-based system can promise absolute security.</p></section>
        <section><h2>Retention and choices</h2><p>We keep information as long as reasonably needed for the purpose it was collected, to maintain business records, or to meet legal obligations. You may ask to review, correct, or delete eligible information by emailing <a href="mailto:max@pixel-hutch.com">max@pixel-hutch.com</a>.</p></section>
        <section><h2>Changes</h2><p>We may update this policy as our services change. The effective date above shows the latest revision.</p></section>
      </div>
    </article>
    <footer><a className="footer-brand" href="/"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><strong>PIXEL HUTCH</strong></a><p>Websites, systems, and support for businesses.</p><div><img className="footer-copyright" src="/pixel-hutch-copyright.png" alt="Copyright 2026 Pixel Hutch" /><span className="footer-links"><a href="/terms">Terms</a><a href="/">Home</a></span></div></footer>
  </main>;
}
