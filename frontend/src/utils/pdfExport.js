import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPdf(filename, title, subtitle, rows) {
  if (!rows || rows.length === 0) return;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 25);
  }

  const headers = Object.keys(rows[0]).map((h) =>
    h.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
  const body = rows.map((row) => Object.values(row).map((v) => (v ?? "").toString()));

  autoTable(doc, {
    head: [headers],
    body,
    startY: subtitle ? 30 : 24,
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 9 },
  });

  doc.save(filename);
}