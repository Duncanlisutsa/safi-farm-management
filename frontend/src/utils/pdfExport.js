import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export a whole list of rows as a table PDF (unchanged behaviour, kept for
 * places that still want a bulk export of every row in a module).
 */
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

// Accent colors (RGB) per module, used for the PDF letterhead/band so each
// module's downloaded record is visually distinguishable at a glance.
export const PDF_ACCENTS = {
  crops: [5, 150, 105], // emerald-600
  employees: [79, 70, 229], // indigo-600
  pigs: [225, 29, 72], // rose-600
  poultry: [217, 119, 6], // amber-600
  tea: [13, 148, 136], // teal-600
  aquaculture: [2, 132, 199], // sky-600
  factory: [124, 58, 237], // violet-600
  planner: [192, 38, 211], // fuchsia-600
  users: [67, 56, 202], // indigo-700
};

function formatLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? `${value.length} record(s)` : "—";
  if (typeof value === "object") return "—";
  return String(value);
}

/**
 * Export a SINGLE record/row as a polished "detail sheet" style PDF —
 * a colored letterhead followed by a two-column label/value table.
 *
 * @param {string} filename   e.g. "crop-Tomato-A12.pdf"
 * @param {string} title      e.g. "Crop Record"
 * @param {string} subtitle   e.g. "Tomato — Plot A12"
 * @param {object} record     the raw record object
 * @param {string[]} fields   ordered list of keys from `record` to include
 * @param {[number,number,number]} accent  RGB accent color
 * @param {object} fieldLabels  optional { key: "Custom Label" } overrides
 */
export function exportRecordToPdf(filename, title, subtitle, record, fields, accent = [22, 101, 52], fieldLabels = {}) {
  if (!record) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Letterhead band
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(title, 14, 16);
  if (subtitle) {
    doc.setFontSize(11);
    doc.text(subtitle, 14, 25);
  }
  doc.setFontSize(9);
  doc.text("SAFI Farm Management", pageWidth - 14, 16, { align: "right" });
  doc.text(new Date().toLocaleString(), pageWidth - 14, 22, { align: "right" });

  const keys = fields && fields.length ? fields : Object.keys(record);
  const body = keys
    .filter((k) => typeof record[k] !== "object" || record[k] === null)
    .map((k) => [fieldLabels[k] || formatLabel(k), formatValue(record[k])]);

  autoTable(doc, {
    startY: 40,
    head: [["Field", "Value"]],
    body,
    theme: "striped",
    headStyles: { fillColor: accent, textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
  });

  doc.setTextColor(150);
  doc.setFontSize(8);
  doc.text(
    "Generated from SAFI Farm Management System",
    14,
    doc.internal.pageSize.getHeight() - 10
  );

  doc.save(filename);
}