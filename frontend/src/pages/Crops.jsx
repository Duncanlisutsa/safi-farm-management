import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCrops, createCrop } from "../api/crops";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const CROP_TYPES = ["vegetable", "herb", "spice", "root"];
const STATUS_COLORS = {
  planted: "bg-gray-200 text-gray-800",
  growing: "bg-yellow-100 text-yellow-800",
  ready: "bg-blue-100 text-blue-800",
  harvested: "bg-green-100 text-green-800",
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

export default function Crops() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "admin" || user?.role === "farm_manager";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", crop_type: "vegetable", variety: "", plot_bed: "",
    planting_date: "", expected_harvest_date: "", status: "planted",
    notes: "", photo: null,
  });

  const { data: crops, isLoading, isError } = useQuery({
    queryKey: ["crops"],
    queryFn: getCrops,
  });

  const createMutation = useMutation({
    mutationFn: createCrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      toast.success("Crop added");
      setShowForm(false);
      setForm({
        name: "", crop_type: "vegetable", variety: "", plot_bed: "",
        planting_date: "", expected_harvest_date: "", status: "planted",
        notes: "", photo: null,
      });
    },
    onError: (err) => toastFieldErrors(err, "Could not add crop"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") data.append(key, value);
    });
    createMutation.mutate(data);
  };

  if (isLoading) return <Spinner label="Loading crops..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load crops. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Crops & Herbs</h1>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Crop"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Crop name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.crop_type}
            onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {CROP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            placeholder="Variety (optional)"
            value={form.variety}
            onChange={(e) => setForm({ ...form, variety: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Plot / Bed"
            value={form.plot_bed}
            onChange={(e) => setForm({ ...form, plot_bed: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Planting date</label>
            <input
              type="date"
              value={form.planting_date}
              onChange={(e) => setForm({ ...form, planting_date: e.target.value })}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expected harvest (optional)</label>
            <input
              type="date"
              value={form.expected_harvest_date}
              onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Photo (optional, for herbs/spices)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
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
            {createMutation.isPending ? "Saving..." : "Add Crop"}
          </button>
        </form>
      )}

      {crops?.results?.length === 0 ? (
        <EmptyState icon="🌱" title="No crops recorded yet" subtitle="Add your first crop to start tracking." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {crops?.results?.map((crop) => (
            <div key={crop.id} className="bg-white rounded shadow overflow-hidden">
              {crop.photo && (
                <img src={crop.photo} alt={crop.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{crop.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[crop.status]}`}>
                    {crop.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 capitalize">{crop.crop_type} — {crop.plot_bed}</p>
                {crop.variety && <p className="text-sm text-gray-500">{crop.variety}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}