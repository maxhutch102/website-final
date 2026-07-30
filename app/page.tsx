"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";

const services = [
  {
    number: "01",
    title: "Websites that work",
    copy: "Fast, clear websites that look like your business, guide customers to act, and stay easy to manage.",
    tags: ["Strategy", "Design", "Build"],
  },
  {
    number: "02",
    title: "A business hub built around you",
    copy: "Connect customers, projects, billing, files, schedules, reporting, and client communication in one configurable system.",
    tags: ["CRM", "Client portal", "Operations"],
  },
  {
    number: "03",
    title: "Support, online or onsite",
    copy: "A real partner for updates, improvements, computers, printers, and the everyday technology problems that slow you down.",
    tags: ["Care plans", "Onsite IT", "Hardware"],
  },
];

const steps = [
  ["01", "We listen", "You tell us what is frustrating, what you need, and what success would look like."],
  ["02", "We simplify", "We shape the clearest solution and explain the plan without burying you in jargon."],
  ["03", "We build", "You see real progress, give feedback, and get something your business can actually use."],
];

const packages = [
  {
    name: "Starter Site",
    price: "$1,495",
    description: "A polished, professional home for a business that needs to look credible and turn visitors into conversations.",
    features: ["Up to 5 pages", "Mobile-friendly design", "Contact form", "Basic search setup"],
  },
  {
    name: "Business Site",
    price: "$2,495",
    description: "A more capable site for an established business ready for stronger content, integrations, and room to grow.",
    features: ["Expanded page count", "Stronger search setup", "Business integrations", "Custom functionality"],
    featured: true,
  },
  {
    name: "Online Store",
    price: "From $3,495",
    description: "A complete online storefront built to make selling, fulfillment, and day-to-day management feel straightforward.",
    features: ["Product catalog", "Secure payments", "Shipping or pickup setup", "Store management training"],
  },
];

function PixelReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`pixel-reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
      <div className="pixel-cover" aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => <i key={index} />)}
      </div>
    </div>
  );
}

export default function Home() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Pixel Hutch inquiry from ${String(form.get("name") || "the website")}`);
    const body = encodeURIComponent(
      `Name: ${String(form.get("name") || "")}\nEmail: ${String(form.get("email") || "")}\nProject: ${String(form.get("project") || "")}\n\n${String(form.get("message") || "")}`,
    );
    setSent(true);
    window.location.href = `mailto:max@pixel-hutch.com?subject=${subject}&body=${body}`;
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pixel Hutch home">
          <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch, precision solutions for your business" />
        </a>
        <nav aria-label="Primary navigation">
          <a href="/services">Services &amp; Pricing</a>
          <a href="/work">Our work</a>
          <a href="/booking-systems">Booking systems</a>
          <a href="#process">Process</a>
          <a href="/about">About</a>
        </nav>
        <a className="button button-small" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero section-shell" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Business technology without the runaround</p>
          <h1>BUILD A<br /><em>BETTER</em><br />BUSINESS.</h1>
          <p className="hero-lede">
            Websites, business systems, and ongoing tech support built for real businesses and explained in plain English.
          </p>
          <div className="hero-actions">
            <a className="button" href="#contact">Start a conversation <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="/work">See what we build <span aria-hidden="true">→</span></a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Connected website and business system illustration">
          <div className="pixel-sprinkle sprinkle-one" aria-hidden="true" />
          <div className="pixel-sprinkle sprinkle-two" aria-hidden="true" />
          <div className="hero-art-frame">
            <img src="/pixel-hutch-hero.png" alt="A website connected to organized business workflow tools" />
          </div>
          <div className="floating-note note-one"><b>BUILT FOR YOU</b><span>Not from a generic template.</span></div>
          <div className="floating-note note-two"><b>PLAIN ENGLISH</b><span>Always.</span></div>
        </div>
      </section>

      <div className="trust-strip" aria-label="Pixel Hutch values">
        <span>FAMILY OWNED</span><i />
        <span>ARIZONA BASED</span><i />
        <span>BUILT FOR BUSINESS</span>
      </div>

      <section className="services section-shell" id="services">
        <div className="section-intro">
          <p className="kicker">WHAT WE DO</p>
          <h2>Technology should make your work <span>easier.</span></h2>
          <p>We focus on the practical pieces that help businesses look better, stay organized, and grow without adding more chaos.</p>
        </div>
        <div className="service-grid">
          {services.map((service) => (
            <PixelReveal className="service-card" key={service.number}>
              <div className="service-top"><span>{service.number}</span><i aria-hidden="true" /></div>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
              <div className="tag-row">{service.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <a className="service-link" href="/services">Explore this service <span aria-hidden="true">→</span></a>
            </PixelReveal>
          ))}
        </div>
      </section>

      <section className="work-section" id="work">
        <div className="section-shell">
          <div className="section-intro work-intro">
            <p className="kicker kicker-light">WHAT WE&apos;RE BUILDING</p>
            <h2>Real ideas turned into <span>useful tools.</span></h2>
          </div>
          <div className="work-grid">
            <PixelReveal className="project-card project-featured">
              <div className="project-window hub-window" aria-hidden="true">
                <div className="window-bar"><i /><i /><i /></div>
                <div className="hub-mini"><aside><b>PH</b><i /><i /><i /></aside><section><span>BUSINESS HUB</span><div><i /><i /><i /></div><strong /></section></div>
              </div>
              <div className="project-copy">
                <p>CRM + CLIENT PORTAL + OPERATIONS</p>
                <h3>Pixel Hutch Business Hub</h3>
                <span>A working system that connects the full customer journey, from first inquiry through projects, billing, files, and ongoing support.</span>
                <a className="service-link" href="/crm-demo">Try the interactive demo <span aria-hidden="true">→</span></a>
              </div>
            </PixelReveal>
            <PixelReveal className="project-card project-featured">
              <div className="project-window jewelry-window" aria-hidden="true">
                <div className="window-bar"><i /><i /><i /></div>
                <div className="jewelry-stage"><span className="earring earring-one" /><span className="earring earring-two" /><span className="necklace" /></div>
              </div>
              <div className="project-copy">
                <p>WEBSITE + ONLINE SHOP</p>
                <h3>Lady T&apos;s Custom Designs</h3>
                <span>A bold, welcoming home for one-of-a-kind jewelry and custom pieces.</span>
              </div>
            </PixelReveal>
            <PixelReveal className="project-card">
              <div className="project-window pizza-window" aria-hidden="true">
                <div className="window-bar"><i /><i /><i /></div>
                <div className="pizza-mark"><span>H</span><i /></div>
              </div>
              <div className="project-copy">
                <p>BRAND + WEBSITE CONCEPT</p>
                <h3>Hutch Pizza</h3>
                <span>A digital home built around scratch-made food, wood fire, and family.</span>
              </div>
            </PixelReveal>
          </div>
        </div>
      </section>

      <section className="process section-shell" id="process">
        <div className="section-intro compact-intro">
          <p className="kicker">HOW IT WORKS</p>
          <h2>No mystery. No disappearing act.</h2>
          <p>You always know what we&apos;re building, why it matters, and what comes next.</p>
        </div>
        <div className="steps">
          {steps.map(([number, title, copy]) => (
            <PixelReveal className="step" key={number}>
              <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>
            </PixelReveal>
          ))}
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="section-shell">
          <div className="section-intro pricing-intro">
            <p className="kicker">STRAIGHTFORWARD PRICING</p>
            <h2>Start with what your business actually needs.</h2>
            <p>Every project is shaped around your goals. These starting points make the budget clear before we ever begin.</p>
          </div>
          <div className="pricing-grid">
            {packages.map((item) => (
              <PixelReveal className={`pricing-card ${item.featured ? "pricing-featured" : ""}`} key={item.name}>
                {item.featured && <span className="popular-label">MOST POPULAR</span>}
                <p className="package-name">{item.name}</p>
                <h3>{item.price}</h3>
                <p>{item.description}</p>
                <ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <a className="text-link" href={`/services#${item.name === "Starter Site" ? "websites" : item.name === "Business Site" ? "websites" : "stores"}`}>See package details <span aria-hidden="true">→</span></a>
              </PixelReveal>
            ))}
          </div>
          <div className="care-plans">
            <div><span>ESSENTIAL CARE</span><strong>$99/month</strong><p>Hosting coordination, security, backups, minor updates, and support.</p></div>
            <div><span>GROWTH CARE</span><strong>$199/month</strong><p>More monthly edits, reporting, search monitoring, and priority support.</p></div>
            <div><span>CUSTOM SYSTEMS</span><strong>Custom quote</strong><p>CRMs, customer portals, automations, and internal business tools.</p></div>
          </div>
          <p className="pricing-note">Projects begin with a 50% deposit. Domains, third-party subscriptions, photography, copywriting, and unusual integrations are quoted separately.</p>
        </div>
      </section>

      <section className="about" id="about">
        <div className="section-shell about-grid">
          <div className="about-graphic" aria-hidden="true">
            <div className="hutch-shape"><span>PH</span></div>
            <i className="about-pixel p1" /><i className="about-pixel p2" /><i className="about-pixel p3" />
          </div>
          <div className="about-copy">
            <p className="kicker">WHY PIXEL HUTCH</p>
            <h2>Serious capability. Personal attention.</h2>
            <p>Pixel Hutch is a family owned Arizona studio built on a simple belief: useful technology should not require a huge budget, an IT department, or a translator.</p>
            <p>We bring real operations experience to every project, so what we build has to do more than look good. It has to work in the real world.</p>
            <div className="about-points"><span>Direct communication</span><span>Practical solutions</span><span>Long term support</span></div>
            <a className="text-link about-more" href="/about">Meet Max and read our story <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className="contact section-shell" id="contact">
        <div className="contact-card">
          <div className="contact-copy">
            <p className="kicker kicker-light">LET&apos;S BUILD SOMETHING USEFUL</p>
            <h2>What would make your business run better?</h2>
            <p>Tell us what you&apos;re working on, even if you&apos;re not sure what the technical solution is yet. That&apos;s our part.</p>
            <a href="mailto:max@pixel-hutch.com">max@pixel-hutch.com <span aria-hidden="true">↗</span></a>
          </div>
          {sent ? (
            <div className="form-success" role="status">
              <span aria-hidden="true">✓</span>
              <h3>Message ready.</h3>
              <p>Your email app should open with your project details ready to send. If it does not, email Max directly and we&apos;ll get the conversation started.</p>
              <a className="button button-dark" href="mailto:max@pixel-hutch.com">Email Max</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>Name<input name="name" autoComplete="name" required /></label>
              <label>Email<input type="email" name="email" autoComplete="email" required /></label>
              <label>What can we help with?<select name="project" defaultValue=""><option value="" disabled>Select one</option><option>Website</option><option>Business system or CRM</option><option>Onsite IT or hardware</option><option>Ongoing support</option><option>Not sure yet</option></select></label>
              <label>Tell us a little more<textarea name="message" rows={4} required /></label>
              <button className="button button-dark" type="submit">Send it our way <span aria-hidden="true">↗</span></button>
            </form>
          )}
        </div>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><strong>PIXEL HUTCH</strong></div>
        <p>Websites, systems, and support for businesses.</p>
        <div><img className="footer-copyright" src="/pixel-hutch-copyright.png" alt="Copyright 2026 Pixel Hutch" /><span className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top ↑</a></span></div>
      </footer>
    </main>
  );
}
