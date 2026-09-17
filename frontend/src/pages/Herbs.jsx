import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getHerbs, createHerb, updateHerb } from "../api/herbs";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import EditModal from "../components/EditModal";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const HERB_TYPES = ["herb", "spice"];
const PART_USED = ["leaf", "root", "stem", "flower", "seed", "bark", "whole_plant"];
const USE_CATEGORY = ["culinary", "medicinal", "commercial", "multiple"];
const DRYING_METHODS = ["air_dry", "sun_dry", "oven_dry", "fresh_only", "none"];
const HARVEST_TYPES = ["one_time", "recurring"];
const STATUS_OPTIONS = ["planted", "growing", "active", "harvested", "dormant", "retired"];
const STATUS_COLORS = {
  planted: "bg-gray-200 text-gray-800",
  growing: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  harvested: "bg-green-100 text-green-800",
  dormant: "bg-orange-100 text-orange-800",
  retired: "bg-red-100 text-red-800",
};

const EDIT_FIELDS = [
  { name: "name", label: "Herb name", type: "text", required: true },
  { name: "herb_type", label: "Type", type: "select", options: HERB_TYPES },
  { name: "variety", label: "Variety", type: "text" },
  { name: "part_used", label: "Part used", type: "select", options: PART_USED },
  { name: "use_category", label: "Use category", type: "select", options: USE_CATEGORY },
  { name: "drying_method", label: "Drying method", type: "select", options: DRYING_METHODS },
  { name: "harvest_type", label: "Harvest type", type: "select", options: HARVEST_TYPES },
  { name: "plot_bed", label: "Plot / Bed", type: "text", required: true },
  { name: "planting_date", label: "Planting date", type: "date", required: true },
  { name: "expected_harvest_date", label: "Expected harvest", type: "date" },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { name: "photo", label: "Photo", type: "file", accept: "image/*", span: 2 },
  { name: "preparation_notes", label: "Preparation / dosage notes", type: "textarea", span: 2 },
  { name: "notes", label: "Notes", type: "textarea", span: 2 },
];

const PDF_FIELDS = [
  "name", "herb_type", "variety", "part_used", "use_category", "drying_method",
  "harvest_type", "plot_bed", "planting_date", "expected_harvest_date", "status",
  "preparation_notes", "notes",
];

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

const EMPTY_FORM = {
  name: "", herb_type: "herb", variety: "", part_used: "leaf", use_category: "culinary",
  drying_method: "none", harvest_type: "recurring", plot_bed: "", planting_date: "",
  expected_harvest_date: "", status: "planted", preparation_notes: "", notes: "", photo: null,
};

export default function Herbs() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "admin" || user?.role === "farm_manager";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingHerb, setEditingHerb] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const { data: herbs, isLoading, isError } = useQuery({
    queryKey: ["herbs"],
    queryFn: getHerbs,
  });

  const createMutation = useMutation({
    mutationFn: createHerb,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["herbs"] });
      toast.success("Herb added");
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toastFieldErrors(err, "Could not add herb"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateHerb(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["herbs"] });
      toast.success("Herb updated");
      setEditingHerb(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update herb"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") data.append(key, value);
    });
    createMutation.mutate(data);
  };

  const openEdit = (herb) => {
    setEditingHerb(herb);
    setEditForm({ ...herb });
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
    updateMutation.mutate({ id: editingHerb.id, data });
  };

  const downloadPdf = (herb) => {
    exportRecordToPdf(
      `herb-${herb.name}-${herb.id}.pdf`,
      "Herb Record",
      `${herb.name} — ${herb.plot_bed}`,
      herb,
      PDF_FIELDS,
      PDF_ACCENTS.herbs
    );
  };

  if (isLoading) return <Spinner label="Loading herbs..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load herbs. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Herbs & Spices</h1>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-lime-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-lime-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Herb"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-lime-500">
          <input
            placeholder="Herb name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.herb_type}
            onChange={(e) => setForm({ ...form, herb_type: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {HERB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            placeholder="Variety (optional)"
            value={form.variety}
            onChange={(e) => setForm({ ...form, variety: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={form.part_used}
            onChange={(e) => setForm({ ...form, part_used: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {PART_USED.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
          </select>
          <select
            value={form.use_category}
            onChange={(e) => setForm({ ...form, use_category: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {USE_CATEGORY.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            value={form.drying_method}
            onChange={(e) => setForm({ ...form, drying_method: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {DRYING_METHODS.map((d) => <option key={d} value={d}>{d.replace("_", " ")}</option>)}
          </select>
          <select
            value={form.harvest_type}
            onChange={(e) => setForm({ ...form, harvest_type: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {HARVEST_TYPES.map((h) => <option key={h} value={h}>{h.replace("_", " ")}</option>)}
          </select>
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
            <label className="block text-xs text-gray-500 mb-1">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <textarea
            placeholder="Preparation / dosage notes (optional)"
            value={form.preparation_notes}
            onChange={(e) => setForm({ ...form, preparation_notes: e.target.value })}
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
            className="bg-lime-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-lime-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Saving..." : "Add Herb"}
          </button>
        </form>
      )}

      {herbs?.results?.length === 0 ? (
        <EmptyState icon="🌿" title="No herbs recorded yet" subtitle="Add your first herb or spice to start tracking." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-lime-600 text-white">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Part Used</th>
                <th className="px-4 py-3">Use</th>
                <th className="px-4 py-3">Plot / Bed</th>
                <th className="px-4 py-3">Harvest Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {herbs?.results?.map((herb, i) => (
                <tr key={herb.id} className={`border-t hover:bg-lime-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 font-medium">{herb.name}</td>
                  <td className="px-4 py-3 capitalize">{herb.herb_type}</td>
                  <td className="px-4 py-3 capitalize">{herb.part_used?.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize">{herb.use_category}</td>
                  <td className="px-4 py-3">{herb.plot_bed}</td>
                  <td className="px-4 py-3 capitalize">{herb.harvest_type?.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[herb.status]}`}>
                      {herb.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      accent="lime"
                      onEdit={canManage ? () => openEdit(herb) : undefined}
                      onDownload={() => downloadPdf(herb)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        open={!!editingHerb}
        onClose={() => { setEditingHerb(null); setEditForm(null); }}
        title={editingHerb ? `Edit ${editingHerb.name}` : ""}
        fields={EDIT_FIELDS}
        values={editForm}
        onChange={setEditForm}
        onSubmit={submitEdit}
        submitting={updateMutation.isPending}
        accent="lime"
      />
    </div>
  );
}