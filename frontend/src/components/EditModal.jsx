import Modal from "./Modal";

/**
 * Generic "edit record" modal. Renders a form from a `fields` config array
 * and calls `onSubmit(values)` when saved.
 *
 * fields: [
 *   { name: "name", label: "Crop name", type: "text", required: true },
 *   { name: "status", label: "Status", type: "select", options: ["planted","growing"] },
 *   { name: "notes", label: "Notes", type: "textarea", span: 2 },
 * ]
 */
export default function EditModal({
  open,
  onClose,
  title,
  fields,
  values,
  onChange,
  onSubmit,
  submitting,
  accent = "green",
}) {
  if (!values) return null;

  const accentBtn = {
    green: "bg-green-600 hover:bg-green-700",
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    rose: "bg-rose-600 hover:bg-rose-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    teal: "bg-teal-600 hover:bg-teal-700",
    sky: "bg-sky-600 hover:bg-sky-700",
    violet: "bg-violet-600 hover:bg-violet-700",
    fuchsia: "bg-fuchsia-600 hover:bg-fuchsia-700",
  }[accent] || "bg-green-600 hover:bg-green-700";

  const accentText = {
    green: "text-green-700 border-green-200 bg-green-50",
    indigo: "text-indigo-700 border-indigo-200 bg-indigo-50",
    rose: "text-rose-700 border-rose-200 bg-rose-50",
    amber: "text-amber-700 border-amber-200 bg-amber-50",
    teal: "text-teal-700 border-teal-200 bg-teal-50",
    sky: "text-sky-700 border-sky-200 bg-sky-50",
    violet: "text-violet-700 border-violet-200 bg-violet-50",
    fuchsia: "text-fuchsia-700 border-fuchsia-200 bg-fuchsia-50",
  }[accent] || "text-green-700 border-green-200 bg-green-50";

  const handleField = (name, val) => onChange({ ...values, [name]: val });

  return (
    <Modal open={open} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values);
        }}
        className="max-h-[80vh] overflow-y-auto"
      >
        <div className={`-m-6 mb-4 px-6 py-4 rounded-t-lg border-b ${accentText}`}>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.name} className={f.span === 2 ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                {f.label}
                {f.required && <span className="text-rose-500"> *</span>}
              </label>

              {f.type === "select" ? (
                <select
                  value={values[f.name] ?? ""}
                  onChange={(e) => handleField(f.name, e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  required={f.required}
                >
                  {f.options.map((opt) => (
                    <option key={opt.value ?? opt} value={opt.value ?? opt}>
                      {opt.label ?? opt}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={values[f.name] ?? ""}
                  onChange={(e) => handleField(f.name, e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  rows={3}
                />
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!values[f.name]}
                  onChange={(e) => handleField(f.name, e.target.checked)}
                  className="h-4 w-4"
                />
              ) : f.type === "file" ? (
                <div>
                  {typeof values[f.name] === "string" && values[f.name] && (
                    
                      href={values[f.name]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block mb-1"
                    >
                      View current file
                    </a>
                  )}
                  <input
                    type="file"
                    accept={f.accept}
                    onChange={(e) => handleField(f.name, e.target.files[0] || null)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave empty to keep the current file.</p>
                </div>
              ) : (
                <input
                  type={f.type || "text"}
                  step={f.step}
                  value={values[f.name] ?? ""}
                  onChange={(e) => handleField(f.name, e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  required={f.required}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border rounded py-2 hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 text-white rounded py-2 disabled:opacity-50 transition-colors ${accentBtn}`}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}