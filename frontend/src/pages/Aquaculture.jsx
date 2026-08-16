import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getPonds, createPond, getPondReports, addPondReport } from "../api/aquaculture";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const STATUS_OPTIONS = ["active", "fingerlings", "harvest_ready", "harvested", "empty"];
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  fingerlings: "bg-blue-100 text-blue-800",
  harvest_ready: "bg-yellow-100 text-yellow-800",
  harvested: "bg-gray-200 text-gray-600",
  empty: "bg-red-100 text-red-800",
};
const ACTIVITY_TYPES = ["feed_log", "water_quality", "weight_sample", "mortality", "harvest"];

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

export default function Aquaculture() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "admin" || user?.role === "farm_manager";

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    name: "", species: "", stocking_date: "", stocking_count: "",
    feed_type: "", target_harvest_date: "", status: "empty",
  });

  const { data: ponds, isLoading, isError } = useQuery({
    queryKey: ["ponds"],
    queryFn: getPonds,
  });

  const createMutation = useMutation({
    mutationFn: createPond,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ponds"] });
      toast.success("Pond added");
      setShowForm(false);
      setForm({ name: "", species: "", stocking_date: "", stocking_count: "", feed_type: "", target_harvest_date: "", status: "empty" });
    },
    onError: (err) => toastFieldErrors(err, "Could not add pond"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.stocking_count) payload.stocking_count = Number(payload.stocking_count);
    else delete payload.stocking_count;
    if (!payload.stocking_date) delete payload.stocking_date;
    if (!payload.target_harvest_date) delete payload.target_harvest_date;
    createMutation.mutate(payload);
  };

  if (isLoading) return <Spinner label="Loading ponds..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load ponds. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aquaculture</h1>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Pond"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Pond name (e.g. Pond A)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            placeholder="Species (e.g. Tilapia)"
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stocking date (optional)</label>
            <input
              type="date"
              value={form.stocking_date}
              onChange={(e) => setForm({ ...form, stocking_date: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <input
            placeholder="Stocking count (optional)"
            type="number"
            value={form.stocking_count}
            onChange={(e) => setForm({ ...form, stocking_count: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Feed type (optional)"
            value={form.feed_type}
            onChange={(e) => setForm({ ...form, feed_type: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target harvest date (optional)</label>
            <input
              type="date"
              value={form.target_harvest_date}
              onChange={(e) => setForm({ ...form, target_harvest_date: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded col-span-2 disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Add Pond"}
          </button>
        </form>
      )}

      {ponds?.results?.length === 0 ? (
        <EmptyState icon="🐟" title="No ponds recorded yet" subtitle="Add your first pond to start tracking." />
      ) : (
        <div className="space-y-3">
          {ponds?.results?.map((pond) => (
            <div key={pond.id} className="bg-white rounded shadow overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === pond.id ? null : pond.id)}
                className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{pond.name}</span>
                  <span className="text-sm text-gray-500">{pond.species || "—"}</span>
                  {pond.stocking_count && <span className="text-sm text-gray-500">{pond.stocking_count} fish</span>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[pond.status]}`}>
                  {pond.status.replace("_", " ")}
                </span>
              </button>

              {expandedId === pond.id && (
                <PondDetail pond={pond} canSubmit={canManage || user?.role === "fish_attendant"} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PondDetail({ pond, canSubmit }) {
  const queryClient = useQueryClient();
  const [reportForm, setReportForm] = useState({ report_date: "", activity_type: "feed_log", quantity_value: "", notes: "" });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["pond-reports", pond.id],
    queryFn: () => getPondReports(pond.id),
  });

  const reportMutation = useMutation({
    mutationFn: addPondReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pond-reports", pond.id] });
      toast.success("Report logged");
      setReportForm({ report_date: "", activity_type: "feed_log", quantity_value: "", notes: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not log report"),
  });

  return (
    <div className="border-t px-4 py-4 bg-gray-50">
      <h4 className="font-semibold mb-2 text-sm">Recent Activity</h4>
      {isLoading ? (
        <Spinner label="Loading reports..." />
      ) : (
        <ul className="text-sm space-y-1 mb-4 max-h-48 overflow-y-auto">
          {reports?.results?.length > 0 ? (
            reports.results.map((r) => (
              <li key={r.id} className="flex justify-between border-b py-1">
                <span className="capitalize">{r.activity_type.replace("_", " ")}</span>
                <span>{r.quantity_value || "—"}</span>
                <span className="text-gray-500">{r.report_date}</span>
              </li>
            ))
          ) : (
            <li className="text-gray-400">No activity logged yet.</li>
          )}
        </ul>
      )}

      {canSubmit && (
        <form
          onSubmit={(e) => { e.preventDefault(); reportMutation.mutate({ pond: pond.id, ...reportForm }); }}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          <input
            type="date"
            value={reportForm.report_date}
            onChange={(e) => setReportForm({ ...reportForm, report_date: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
            required
          />
          <select
            value={reportForm.activity_type}
            onChange={(e) => setReportForm({ ...reportForm, activity_type: e.target.value })}
            className="border rounded px-2 py-1 text-sm"
          >
            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
          <input
            placeholder='e.g. "12 kg feed" or "avg 620g/fish"'
            value={reportForm.quantity_value}
            onChange={(e) => setReportForm({ ...reportForm, quantity_value: e.target.value })}
            className="border rounded px-2 py-1 text-sm md:col-span-2"
          />
          <textarea
            placeholder="Notes (optional)"
            value={reportForm.notes}
            onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
            className="border rounded px-2 py-1 text-sm md:col-span-2"
          />
          <button
            type="submit"
            disabled={reportMutation.isPending}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm md:col-span-2 disabled:opacity-50"
          >
            Log Report
          </button>
        </form>
      )}
    </div>
  );
}