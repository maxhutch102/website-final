"use client";

type LineItem = { description: string; quantity: number; rateCents: number };

export default function DocumentActions({
  number,
  customer,
  lineItems,
}: {
  number: string;
  customer: string;
  lineItems: LineItem[];
}) {
  function printDocument() {
    window.print();
  }

  function downloadWordCopy() {
    const printable = document.querySelector(".print-document")?.outerHTML || "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${number}</title></head><body>${printable}</body></html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${number}-${customer.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    const rows = [
      ["Description", "Quantity", "Rate", "Amount"],
      ...lineItems.map(item => [
        item.description,
        String(item.quantity),
        (item.rateCents / 100).toFixed(2),
        ((item.quantity * item.rateCents) / 100).toFixed(2),
      ]),
    ];
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${number}-line-items.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="document-toolbar" aria-label="Document actions">
      <a href="/crm">← Back to Business Hub</a>
      <div>
        <button onClick={printDocument}>Print / Save as PDF</button>
        <button onClick={downloadWordCopy}>Download Word copy</button>
        <button onClick={downloadCsv}>Download CSV</button>
      </div>
    </div>
  );
}
