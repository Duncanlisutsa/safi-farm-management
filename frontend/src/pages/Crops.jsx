import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getCrops, createCrop, updateCrop } from "../api/crops";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import EditModal from "../components/EditModal";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const CROP_TYPES = ["vegetable", "herb", "spice", "root"];
const STATUS_OPTIONS = ["planted", "growing", "ready", "harvested"];
const STATUS_COLORS = {
  planted: "bg-gray-200 text-gray-800",
  growing: "bg-yellow-100 text-yellow-800",
  ready: "bg-blue-100 text-blue-800",
  harvested: "bg-green-100 text-green-800",
};

const EDIT_FIELDS = [
  { name: "name", label: "Crop name", type: "text", required: true },
  { name: "crop_type", label: "Crop type", type: "select", options: CROP_TYPES },
  { name: "variety", label: "Variety", type: "text" },
  { name: "plot_bed", label: "Plot / Bed", type: "text", required: true },
  { name: "planting_date", label: "Planting date", type: "date", required: true },
  { name: "expected_harvest_date", label: "Expected harvest", type: "date" },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { name: "photo", label: "Photo", type: "file", accept: "image/*", span: 2 },
  { name: "notes", label: "Notes", type: "textarea", span: 2 },
];

const PDF_FIELDS = ["name", "crop_type", "variety", "plot_bed", "planting_date", "expected_harvest_date", "status", "notes"];

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
  const [editingCrop, setEditingCrop] = useState(null);
  const [editForm, setEditForm] = useState(null);

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCrop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crops"] });
      toast.success("Crop updated");
      setEditingCrop(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update crop"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") data.append(key, value);
    });
    createMutation.mutate(data);
  };

  const openEdit = (crop) => {
    setEditingCrop(crop);
    setEditForm({ ...crop });
  };

  const submitEdit = (values) => {
    const data = new FormData();
    EDIT_FIELDS.forEach(({ name }) => {
      const value = values[name];
      if (name === "photo") {
        if (value instanceof File) data.append("photo", value);
        return;
      }
      if (value !== null && value !== undefined) data.append(name, value);
    });
    updateMutation.mutate({ id: editingCrop.id, data });
  };

  const downloadPdf = (crop) => {
    exportRecordToPdf(
      `crop-${crop.name}-${crop.id}.pdf`,
      "Crop Record",
      `${crop.name} — ${crop.plot_bed}`,
      crop,
      PDF_FIELDS,
      PDF_ACCENTS.crops
    );
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
            className="bg-emerald-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-emerald-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Crop"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-emerald-500">
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
            className="bg-emerald-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Saving..." : "Add Crop"}
          </button>
        </form>
      )}

      {crops?.results?.length === 0 ? (
        <EmptyState icon="🌱" title="No crops recorded yet" subtitle="Add your first crop to start tracking." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Variety</th>
                <th className="px-4 py-3">Plot / Bed</th>
                <th className="px-4 py-3">Planted</th>
                <th className="px-4 py-3">Expected Harvest</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {crops?.results?.map((crop, i) => (
                <tr key={crop.id} className={`border-t hover:bg-emerald-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 font-medium">{crop.name}</td>
                  <td className="px-4 py-3 capitalize">{crop.crop_type}</td>
                  <td className="px-4 py-3">{crop.variety || "—"}</td>
                  <td className="px-4 py-3">{crop.plot_bed}</td>
                  <td className="px-4 py-3">{crop.planting_date}</td>
                  <td className="px-4 py-3">{crop.expected_harvest_date || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[crop.status]}`}>
                      {crop.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      accent="green"
                      onEdit={canManage ? () => openEdit(crop) : undefined}
                      onDownload={() => downloadPdf(crop)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        open={!!editingCrop}
        onClose={() => { setEditingCrop(null); setEditForm(null); }}
        title={editingCrop ? `Edit ${editingCrop.name}` : ""}
        fields={EDIT_FIELDS}
        values={editForm}
        onChange={setEditForm}
        onSubmit={submitEdit}
        submitting={updateMutation.isPending}
        accent="green"
      />
    </div>
  );
}