const ACCENT_STYLES = {
  green: "bg-green-600 hover:bg-green-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
  rose: "bg-rose-600 hover:bg-rose-700",
  amber: "bg-amber-600 hover:bg-amber-700",
  teal: "bg-teal-600 hover:bg-teal-700",
  sky: "bg-sky-600 hover:bg-sky-700",
  violet: "bg-violet-600 hover:bg-violet-700",
  fuchsia: "bg-fuchsia-600 hover:bg-fuchsia-700",
};

/**
 * Standard "Edit" + "Download PDF" action pair for the end of a table row.
 * Pass `onEdit` to omit the edit button entirely (e.g. read-only users).
 */
export default function RowActions({ onEdit, onDownload, accent = "green", editLabel = "Edit" }) {
  const accentClass = ACCENT_STYLES[accent] || ACCENT_STYLES.green;

  return (
    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
      {onEdit && (
        <button
          onClick={onEdit}
          className={`inline-flex items-center gap-1 text-xs font-medium text-white px-3 py-1.5 rounded-md shadow-sm transition-colors ${accentClass}`}
          title={editLabel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.878.506l-3.5 1a.5.5 0 01-.62-.62l1-3.5a2 2 0 01.506-.878l8.5-8.5-8.5 8.5z" />
          </svg>
          {editLabel}
        </button>
      )}
      <button
        onClick={onDownload}
        className="inline-flex items-center gap-1 text-xs font-medium text-white px-3 py-1.5 rounded-md shadow-sm bg-slate-700 hover:bg-slate-800 transition-colors"
        title="Download as PDF"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V3a1 1 0 011-1zM4 15a1 1 0 011 1v1a1 1 0 001 1h8a1 1 0 001-1v-1a1 1 0 112 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        PDF
      </button>
    </div>
  );
}