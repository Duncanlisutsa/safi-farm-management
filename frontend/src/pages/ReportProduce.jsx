import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCrops, getProduceReports, createProduceReport } from "../api/crops";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "pieces", label: "Pieces (count)" },
];

const PDF_FIELDS = ["crop_name", "report_date", "quantity", "unit", "plot_bed", "notes"];
const EMPTY_FORM = { crop: "", report_date: "", quantity: "", unit: "kg", plot_bed: "", notes: "" };

function toastFieldErrors(err, fallback) {
  const data = err.response?.data;
  let msg = fallback;
  if (data && typeof data === "object") {
    msg = Object.entries(data)
      .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(" ") : errs}`)
      .join(" | ");
  }
  toast.error(msg);
}

export default function ReportProduce() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: crops } = useQuery({ queryKey: ["crops"], queryFn: getCrops });
  const { data: reports, isLoading, isError } = useQuery({
    queryKey: ["produce-reports"],
    queryFn: getProduceReports,
  });

  const createMutation = useMutation({
    mutationFn: createProduceReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produce-reports"] });
      toast.success("Harvest reported");
      setForm(EMPTY_FORM);
    },
    onError: (err) => toastFieldErrors(err, "Could not submit report"),
  });

  const handleCropChange = (cropId) => {
    const crop = crops?.results?.find((c) => String(c.id) === cropId);
    setForm({ ...form, crop: cropId, plot_bed: crop?.plot_bed || form.plot_bed });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, crop: Number(form.crop), quantity: Number(form.quantity) });
  };

  const downloadPdf = (report) => {
    exportRecordToPdf(
      `harvest-${report.crop_name}-${report.id}.pdf`,
      "Harvest Report",
      `${report.crop_name} — ${report.report_date}`,
      report,
      PDF_FIELDS,
      PDF_ACCENTS.crops
    );
  };

  if (isLoading) return <Spinner label="Loading harvest reports..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load reports. Try refreshing the page.</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report Produce</h1>
        <p className="text-sm text-gray-500">Log a harvest — in kilograms or by piece count, whichever fits the crop.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-emerald-500">
        <select
          value={form.crop}
          onChange={(e) => handleCropChange(e.target.value)}
          className="border rounded px-3 py-2 col-span-2"
          required
        >
          <option value="">Select crop...</option>
          {crops?.results?.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.plot_bed})</option>
          ))}
        </select>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Harvest date</label>
          <input
            type="date"
            value={form.report_date}
            onChange={(e) => setForm({ ...form, report_date: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <input
          placeholder="Plot / Bed"
          value={form.plot_bed}
          onChange={(e) => setForm({ ...form, plot_bed: e.target.value })}
          className="border rounded px-3 py-2"
          required
        />

        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Quantity"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="border rounded px-3 py-2"
          required
        />
        <select
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="border rounded px-3 py-2"
        >
          {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>

        <textarea
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="border rounded px-3 py-2 col-span-2"
        />

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? "Submitting..." : "Submit Report"}
        </button>
      </form>

      {reports?.results?.length === 0 ? (
        <EmptyState icon="🥑" title="No harvest reports yet" subtitle="Submit your first harvest report above." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="px-4 py-3">Crop</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Plot / Bed</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports?.results?.map((r, i) => (
                <tr key={r.id} className={`border-t hover:bg-emerald-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 font-medium">{r.crop_name}</td>
                  <td className="px-4 py-3">{r.report_date}</td>
                  <td className="px-4 py-3">{r.quantity} {r.unit === "pieces" ? "pcs" : "kg"}</td>
                  <td className="px-4 py-3">{r.plot_bed}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <RowActions accent="green" onDownload={() => downloadPdf(r)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}