import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Booking Systems | Pixel Hutch",
  description: "Custom online booking, client management, staff calendars, payments, reminders, and reporting for appointment-based businesses.",
};

const features = [
  ["Online booking", "Clients choose a provider, service, date, and time from any device."],
  ["Individual calendars", "Each team member controls working hours, breaks, time off, and availability."],
  ["Client records", "Keep appointment history, preferences, notes, forms, and contact details together."],
  ["Business controls", "Manage services, pricing, staff access, inventory, expenses, and reports."],
  ["Direct payments", "Support the payment setup that fits your business, including provider-specific options."],
  ["Your branding", "The public site and booking experience are designed around your business—not ours."],
];

export default function BookingSystemsPage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Pixel Hutch home"><img src="/pixel-hutch-logo.svg" alt="Pixel Hutch" /></a>
        <nav aria-label="Primary navigation">
          <a href="/services">Services &amp; Pricing</a><a href="/work">Our work</a><a className="nav-active" href="/booking-systems">Booking systems</a><a href="/about">About</a>
        </nav>
        <a className="button button-small" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </header>

      <section className="product-hero section-shell">
        <div>
          <p className="eyebrow"><span /> Custom software for appointment businesses</p>
          <h1>BOOKING<br />WITHOUT THE<br /><em>RUNAROUND.</em></h1>
          <p>Give customers an easy way to book while your team gets the calendars, client records, payments, and business tools needed to stay organized.</p>
          <div className="hero-actions">
            <a className="button" href="https://salon-demo.pixel-hutch.com">Try the salon demo <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="/contact">Build one for my business <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div className="booking-preview" aria-label="Booking system interface preview">
          <div className="demo-window-bar"><i /><i /><i /><span>LIVE PRODUCT DEMO</span></div>
          <div className="booking-preview-body">
            <aside><b>J</b><span>BOOK</span><span>CALENDAR</span><span>CLIENTS</span><span>REPORTS</span></aside>
            <section>
              <p>GOOD MORNING</p><h2>Today at a glance</h2>
              <div className="preview-stats"><article><small>APPOINTMENTS</small><strong>8</strong></article><article><small>AVAILABLE</small><strong>5</strong></article><article><small>NEW CLIENTS</small><strong>3</strong></article></div>
              <div className="preview-appointments"><b>10:00</b><span>Cut &amp; style</span><em>CONFIRMED</em><b>11:30</b><span>Color consultation</span><em>NEW</em><b>1:00</b><span>Balayage</span><em>CONFIRMED</em></div>
            </section>
          </div>
        </div>
      </section>

      <div className="trust-strip"><span>YOUR BRAND</span><i /><span>YOUR WORKFLOW</span><i /><span>YOUR CUSTOMER DATA</span></div>

      <section className="product-features section-shell">
        <div className="section-intro"><p className="kicker">ONE CONNECTED SYSTEM</p><h2>Everything needed to turn an opening into a <span>loyal client.</span></h2><p>Start with booking and clients, then add the tools your business actually needs.</p></div>
        <div className="product-feature-grid">{features.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="demo-band">
        <div className="section-shell demo-band-grid">
          <div><p className="kicker kicker-light">CLICK THROUGH THE REAL FLOW</p><h2>Meet Juniper Studio.</h2><p>A fictional salon built to demonstrate the customer website, booking flow, stylist workspace, and owner suite without using a real client&apos;s information.</p></div>
          <div className="demo-actions"><a className="button" href="https://salon-demo.pixel-hutch.com/booking">Try customer booking <span>↗</span></a><a className="button button-dark" href="https://salon-demo.pixel-hutch.com/dashboard">Explore business center <span>↗</span></a></div>
        </div>
      </section>

      <section className="product-audience section-shell"><p className="kicker">BUILT TO ADAPT</p><h2>Not just for salons.</h2><div>{["Barbers & stylists","Nail & beauty professionals","Massage & wellness","Consultants & coaches","Home services","Classes & appointments"].map(item => <span key={item}>{item}</span>)}</div></section>
      <section className="services-cta section-shell"><div><p className="kicker kicker-light">READY FOR YOUR VERSION?</p><h2>Let&apos;s shape it around<br />how you work.</h2></div><a className="button button-dark" href="/contact">Start a conversation <span>↗</span></a></section>
      <footer><a className="footer-brand" href="/"><strong>PIXEL HUTCH</strong></a><p>Websites, systems, and support for businesses.</p><div><span>© 2026 Pixel Hutch</span><span className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top ↑</a></span></div></footer>
    </main>
  );
}
