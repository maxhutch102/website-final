import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer>
      <Link className="footer-brand" href="/">
        <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <strong>PIXEL HUTCH</strong>
      </Link>
      <div className="footer-contact">
        <p>Websites, systems, and support for businesses.</p>
        <span>
          <a href="tel:+14803524096">Call 480-352-4096</a>
          <a href="sms:+14803524096">Text us</a>
          <a href="https://www.facebook.com/profile.php?id=61561260671422" target="_blank" rel="noreferrer">Facebook ↗</a>
        </span>
      </div>
      <div>
        <img className="footer-copyright" src="/pixel-hutch-copyright.png" alt="Copyright 2026 Pixel Hutch" />
        <span className="footer-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="#top">Back to top ↑</a></span>
      </div>
    </footer>
  );
}
