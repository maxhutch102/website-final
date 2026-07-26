"use client";

export default function ClientDocumentPrint() {
  return <button onClick={() => window.print()}>Print / Save as PDF</button>;
}
