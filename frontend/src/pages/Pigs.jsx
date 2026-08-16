import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getPigs, createPig, addPigWeight, addPigVaccination } from "../api/pigs";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const SEX_OPTIONS = ["boar", "sow", "gilt", "barrow"];
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  sold: "bg-blue-100 text-blue-800",
  deceased: "bg-gray-200 text-gray-600",
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

export default function Pigs() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "admin" || user?.role === "farm_manager";

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ tag_id: "", breed: "", sex: "sow", dob: "", acquisition_date: "", notes: "" });

  const { data: pigs, isLoading, isError } = useQuery({
    queryKey: ["pigs"],
    queryFn: getPigs,
  });

  const createMutation = useMutation({
    mutationFn: createPig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pigs"] });
      toast.success("Pig added");
      setShowForm(false);
      setForm({ tag_id: "", breed: "", sex: "sow", dob: "", acquisition_date: "", notes: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not add pig"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.dob) delete payload.dob;
    if (!payload.acquisition_date) delete payload.acquisition_date;
    createMutation.mutate(payload);
  };

  if (isLoading) return <Spinner label="Loading pigs..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load pigs. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pig Records</h1>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Pig"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Tag ID (e.g. P-01)"
            value={form.tag_id}
            onChange={(e) => setForm({ ...form, tag_id: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            placeholder="Breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date of birth (optional)</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Acquisition date (optional)</label>
            <input
              type="date"
              value={form.acquisition_date}
              onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
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
            {createMutation.isPending ? "Saving..." : "Add Pig"}
          </button>
        </form>
      )}

      {pigs?.results?.length === 0 ? (
        <EmptyState icon="🐷" title="No pigs recorded yet" subtitle="Add your first pig to start tracking." />
      ) : (
        <div className="space-y-3">
          {pigs?.results?.map((pig) => (
            <div key={pig.id} className="bg-white rounded shadow overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === pig.id ? null : pig.id)}
                className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{pig.tag_id}</span>
                  <span className="text-sm text-gray-500">{pig.breed}</span>
                  <span className="text-sm text-gray-500 capitalize">{pig.sex}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[pig.status]}`}>
                  {pig.status}
                </span>
              </button>

              {expandedId === pig.id && (
                <PigDetail pig={pig} canManage={canManage} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PigDetail({ pig, canManage }) {
  const queryClient = useQueryClient();
  const [weightForm, setWeightForm] = useState({ weigh_date: "", weight_kg: "" });
  const [vaccForm, setVaccForm] = useState({ vaccine_name: "", date_given: "", next_due_date: "", administered_by: "" });

  const weightMutation = useMutation({
    mutationFn: addPigWeight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pigs"] });
      toast.success("Weight recorded");
      setWeightForm({ weigh_date: "", weight_kg: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not record weight"),
  });

  const vaccMutation = useMutation({
    mutationFn: addPigVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pigs"] });
      toast.success("Vaccination recorded");
      setVaccForm({ vaccine_name: "", date_given: "", next_due_date: "", administered_by: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not record vaccination"),
  });

  return (
    <div className="border-t px-4 py-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-2 text-sm">Weight History</h4>
        <ul className="text-sm space-y-1 mb-3">
          {pig.weights?.length > 0 ? (
            pig.weights.map((w) => (
              <li key={w.id} className="flex justify-between border-b py-1">
                <span>{w.weigh_date}</span>
                <span className="font-medium">{w.weight_kg} kg</span>
              </li>
            ))
          ) : (
            <li className="text-gray-400">No weight records yet.</li>
          )}
        </ul>
        {canManage && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              weightMutation.mutate({ pig: pig.id, ...weightForm });
            }}
            className="flex gap-2"
          >
            <input
              type="date"
              value={weightForm.weigh_date}
              onChange={(e) => setWeightForm({ ...weightForm, weigh_date: e.target.value })}
              className="border rounded px-2 py-1 text-sm flex-1"
              required
            />
            <input
              type="number" step="0.01"
              placeholder="kg"
              value={weightForm.weight_kg}
              onChange={(e) => setWeightForm({ ...weightForm, weight_kg: e.target.value })}
              className="border rounded px-2 py-1 text-sm w-20"
              required
            />
            <button
              type="submit"
              disabled={weightMutation.isPending}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
            >
              Add
            </button>
          </form>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm">Vaccinations</h4>
        <ul className="text-sm space-y-1 mb-3">
          {pig.vaccinations?.length > 0 ? (
            pig.vaccinations.map((v) => (
              <li key={v.id} className="border-b py-1">
                <div className="flex justify-between">
                  <span>{v.vaccine_name}</span>
                  <span className="text-gray-500">{v.date_given}</span>
                </div>
                {v.next_due_date && (
                  <span className="text-xs text-orange-600">Next due: {v.next_due_date}</span>
                )}
              </li>
            ))
          ) : (
            <li className="text-gray-400">No vaccination records yet.</li>
          )}
        </ul>
        {canManage && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              vaccMutation.mutate({ pig: pig.id, ...vaccForm });
            }}
            className="space-y-2"
          >
            <input
              placeholder="Vaccine name"
              value={vaccForm.vaccine_name}
              onChange={(e) => setVaccForm({ ...vaccForm, vaccine_name: e.target.value })}
              className="border rounded px-2 py-1 text-sm w-full"
              required
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={vaccForm.date_given}
                onChange={(e) => setVaccForm({ ...vaccForm, date_given: e.target.value })}
                className="border rounded px-2 py-1 text-sm flex-1"
                required
              />
              <input
                type="date"
                placeholder="Next due"
                value={vaccForm.next_due_date}
                onChange={(e) => setVaccForm({ ...vaccForm, next_due_date: e.target.value })}
                className="border rounded px-2 py-1 text-sm flex-1"
              />
            </div>
            <button
              type="submit"
              disabled={vaccMutation.isPending}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm w-full disabled:opacity-50"
            >
              Record Vaccination
            </button>
          </form>
        )}
      </div>
    </div>
  );
}