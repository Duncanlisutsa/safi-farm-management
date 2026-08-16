import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getTeaLogs, createTeaLog } from "../api/tea";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const GRADE_COLORS = { A: "bg-green-100 text-green-800", B: "bg-yellow-100 text-yellow-800", C: "bg-red-100 text-red-800" };

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

export default function Tea() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canSubmit = ["admin", "farm_manager", "farm_attendant"].includes(user?.role);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    week_number: "", harvest_date: "", quantity_kg: "", grade: "A", plots_harvested: "", notes: "",
  });

  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ["tea-logs"],
    queryFn: getTeaLogs,
  });

  const createMutation = useMutation({
    mutationFn: createTeaLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tea-logs"] });
      toast.success("Harvest log added");
      setShowForm(false);
      setForm({ week_number: "", harvest_date: "", quantity_kg: "", grade: "A", plots_harvested: "", notes: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not add log"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, week_number: Number(form.week_number), quantity_kg: Number(form.quantity_kg) });
  };

  const totalThisPage = logs?.results?.reduce((sum, l) => sum + Number(l.quantity_kg), 0) || 0;

  if (isLoading) return <Spinner label="Loading tea logs..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load tea logs. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tea Management</h1>
          <p className="text-sm text-gray-500">Total: {totalThisPage.toFixed(2)} kg</p>
        </div>
        {canSubmit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ Log Harvest"}
          </button>
        )}
      </div>

      {showForm && canSubmit && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Week number (1-53)"
            type="number" min="1" max="53"
            value={form.week_number}
            onChange={(e) => setForm({ ...form, week_number: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="date"
            value={form.harvest_date}
            onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            placeholder="Quantity (kg)"
            type="number" step="0.01"
            value={form.quantity_kg}
            onChange={(e) => setForm({ ...form, quantity_kg: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
          <input
            placeholder="Plots harvested (comma-separated)"
            value={form.plots_harvested}
            onChange={(e) => setForm({ ...form, plots_harvested: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
          />
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded col-span-2 disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Log Harvest"}
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
        {logs?.results?.length === 0 ? (
          <EmptyState icon="🍃" title="No harvest logs yet" subtitle="Log your first tea harvest to get started." />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Quantity (kg)</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Plots</th>
              </tr>
            </thead>
            <tbody>
              {logs?.results?.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-4 py-3">{log.week_number}</td>
                  <td className="px-4 py-3">{log.harvest_date}</td>
                  <td className="px-4 py-3">{log.quantity_kg}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${GRADE_COLORS[log.grade]}`}>
                      Grade {log.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.plots_harvested || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}