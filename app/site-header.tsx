"use client";

import { useEffect, useState } from "react";

type SiteHeaderProps = {
  active?: "services" | "work" | "about" | "contact";
  home?: boolean;
};

const links = [
  { id: "services", href: "/services", label: "Services & Pricing" },
  { id: "work", href: "/work", label: "Our work" },
  { id: "process", href: "/#process", label: "Process" },
  { id: "about", href: "/about", label: "About" },
] as const;

export default function SiteHeader({ active, home = false }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className={`site-header ${open ? "menu-open" : ""}`}>
      <a className="brand" href={home ? "#top" : "/"} aria-label="Pixel Hutch home" onClick={() => setOpen(false)}>
        <img src="/pixel-hutch-logo.svg" alt="Pixel Hutch, precision solutions for your business" />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map((link) => (
          <a className={active === link.id ? "nav-active" : ""} href={link.href} key={link.id}>{link.label}</a>
        ))}
      </nav>
      <a className={`button button-small header-contact ${active === "contact" ? "nav-active-button" : ""}`} href="/contact">
        Let&apos;s talk <span aria-hidden="true">↗</span>
      </a>
      <button
        className="site-menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-site-menu"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <nav className="mobile-site-menu" id="mobile-site-menu" aria-label="Mobile navigation">
        {links.map((link) => (
          <a className={active === link.id ? "nav-active" : ""} href={link.href} key={link.id} onClick={() => setOpen(false)}>{link.label}</a>
        ))}
        <a className={active === "contact" ? "nav-active" : ""} href="/contact" onClick={() => setOpen(false)}>Contact</a>
        <a href="tel:+14803524096" onClick={() => setOpen(false)}>Call 480-352-4096</a>
        <a href="sms:+14803524096" onClick={() => setOpen(false)}>Text Pixel Hutch</a>
      </nav>
    </header>
  );
}
