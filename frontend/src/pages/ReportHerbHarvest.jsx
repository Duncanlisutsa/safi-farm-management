import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getHerbs, getHerbHarvestLogs, createHerbHarvestLog } from "../api/herbs";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "pieces", label: "Pieces (count)" },
  { value: "bunches", label: "Bunches" },
];
const PART_USED = ["leaf", "root", "stem", "flower", "seed", "bark", "whole_plant"];
const DRYING_METHODS = ["air_dry", "sun_dry", "oven_dry", "fresh_only", "none"];

const PDF_FIELDS = ["herb_name", "harvest_date", "quantity", "unit", "part_harvested", "drying_method", "plot_bed", "notes"];
const EMPTY_FORM = {
  herb: "", harvest_date: "", quantity: "", unit: "kg",
  part_harvested: "", drying_method: "", plot_bed: "", notes: "",
};

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

export default function ReportHerbHarvest() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: herbs } = useQuery({ queryKey: ["herbs"], queryFn: getHerbs });
  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ["herb-harvest-logs"],
    queryFn: getHerbHarvestLogs,
  });

  const createMutation = useMutation({
    mutationFn: createHerbHarvestLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["herb-harvest-logs"] });
      toast.success("Harvest reported");
      setForm(EMPTY_FORM);
    },
    onError: (err) => toastFieldErrors(err, "Could not submit report"),
  });

  const handleHerbChange = (herbId) => {
    const herb = herbs?.results?.find((h) => String(h.id) === herbId);
    setForm({
      ...form,
      herb: herbId,
      plot_bed: herb?.plot_bed || form.plot_bed,
      part_harvested: herb?.part_used || form.part_harvested,
      drying_method: herb?.drying_method || form.drying_method,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, herb: Number(form.herb), quantity: Number(form.quantity) };
    if (!payload.part_harvested) delete payload.part_harvested;
    if (!payload.drying_method) delete payload.drying_method;
    createMutation.mutate(payload);
  };

  const downloadPdf = (log) => {
    exportRecordToPdf(
      `herb-harvest-${log.herb_name}-${log.id}.pdf`,
      "Herb Harvest Report",
      `${log.herb_name} — ${log.harvest_date}`,
      log,
      PDF_FIELDS,
      PDF_ACCENTS.herbs
    );
  };

  if (isLoading) return <Spinner label="Loading harvest logs..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load reports. Try refreshing the page.</p>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report Herb Harvest</h1>
        <p className="text-sm text-gray-500">Log a herb or spice harvest — pick the herb and the rest pre-fills from its record.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-lime-500">
        <select
          value={form.herb}
          onChange={(e) => handleHerbChange(e.target.value)}
          className="border rounded px-3 py-2 col-span-2"
          required
        >
          <option value="">Select herb...</option>
          {herbs?.results?.map((h) => (
            <option key={h.id} value={h.id}>{h.name} ({h.plot_bed})</option>
          ))}
        </select>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Harvest date</label>
          <input
            type="date"
            value={form.harvest_date}
            onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
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

        <select
          value={form.part_harvested}
          onChange={(e) => setForm({ ...form, part_harvested: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Part harvested (same as herb default)</option>
          {PART_USED.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
        </select>
        <select
          value={form.drying_method}
          onChange={(e) => setForm({ ...form, drying_method: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Drying method (same as herb default)</option>
          {DRYING_METHODS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
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
          className="bg-lime-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-lime-700 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? "Submitting..." : "Submit Report"}
        </button>
      </form>

      {logs?.results?.length === 0 ? (
        <EmptyState icon="🌾" title="No herb harvests reported yet" subtitle="Submit your first harvest report above." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-lime-600 text-white">
              <tr>
                <th className="px-4 py-3">Herb</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">Plot / Bed</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs?.results?.map((l, i) => (
                <tr key={l.id} className={`border-t hover:bg-lime-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 font-medium">{l.herb_name}</td>
                  <td className="px-4 py-3">{l.harvest_date}</td>
                  <td className="px-4 py-3">{l.quantity} {l.unit}</td>
                  <td className="px-4 py-3 capitalize">{l.part_harvested?.replace("_", " ") || "—"}</td>
                  <td className="px-4 py-3">{l.plot_bed}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{l.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <RowActions accent="lime" onDownload={() => downloadPdf(l)} />
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