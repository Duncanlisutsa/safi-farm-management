import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getPoultryBatches, createPoultryBatch, addEggLog,
  addPoultryFeedLog, addPoultryActivityReport,
} from "../api/poultry";
import { useAuthStore } from "../store/authStore";

const SPECIES_OPTIONS = ["chicken", "goose", "duck", "turkey", "other"];
const GENDER_OPTIONS = ["male", "female", "mixed"];
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

export default function Poultry() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "admin" || user?.role === "farm_manager";

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    batch_name: "", species: "chicken", breed: "", gender: "mixed",
    count: "", average_size_kg: "", is_layer: false,
    date_of_birth: "", acquisition_date: "", notes: "",
  });

  const { data: batches, isLoading, isError } = useQuery({
    queryKey: ["poultry-batches"],
    queryFn: getPoultryBatches,
  });

  const createMutation = useMutation({
    mutationFn: createPoultryBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poultry-batches"] });
      toast.success("Batch added");
      setShowForm(false);
      setForm({
        batch_name: "", species: "chicken", breed: "", gender: "mixed",
        count: "", average_size_kg: "", is_layer: false,
        date_of_birth: "", acquisition_date: "", notes: "",
      });
    },
    onError: (err) => toastFieldErrors(err, "Could not add batch"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = { ...form, count: Number(form.count) };
    if (!payload.average_size_kg) delete payload.average_size_kg;
    if (!payload.date_of_birth) delete payload.date_of_birth;
    if (!payload.acquisition_date) delete payload.acquisition_date;
    if (payload.species !== "chicken") payload.is_layer = false;
    createMutation.mutate(payload);
  };

  if (isLoading) return <p>Loading poultry...</p>;
  if (isError) return <p className="text-red-600">Failed to load poultry batches.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Poultry</h1>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Batch"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Batch name (e.g. Layers Batch A)"
            value={form.batch_name}
            onChange={(e) => setForm({ ...form, batch_name: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            placeholder="Breed (optional)"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <input
            placeholder="Count"
            type="number"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            placeholder="Average size (kg, optional)"
            type="number" step="0.01"
            value={form.average_size_kg}
            onChange={(e) => setForm({ ...form, average_size_kg: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date of birth (optional)</label>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
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
          {form.species === "chicken" && (
            <label className="flex items-center gap-2 col-span-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_layer}
                onChange={(e) => setForm({ ...form, is_layer: e.target.checked })}
              />
              This is a laying flock (kept for egg production)
            </label>
          )}
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
            {createMutation.isPending ? "Saving..." : "Add Batch"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {batches?.results?.map((batch) => (
          <div key={batch.id} className="bg-white rounded shadow overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === batch.id ? null : batch.id)}
              className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <span className="font-semibold">{batch.batch_name}</span>
                <span className="text-sm text-gray-500 capitalize">{batch.species}</span>
                <span className="text-sm text-gray-500">{batch.count} birds</span>
                {batch.is_layer && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Layers</span>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[batch.status]}`}>
                {batch.status}
              </span>
            </button>

            {expandedId === batch.id && (
              <PoultryDetail batch={batch} canManage={canManage} />
            )}
          </div>
        ))}
        {batches?.results?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No poultry batches recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function PoultryDetail({ batch, canManage }) {
  const queryClient = useQueryClient();
  const isChicken = batch.species === "chicken";

  const [eggForm, setEggForm] = useState({ collection_date: "", eggs_collected: "", broken_eggs: "0" });
  const [feedForm, setFeedForm] = useState({ feed_date: "", feed_type: "", quantity_kg: "" });
  const [reportForm, setReportForm] = useState({ report_date: "", activity_type: "observation", count_affected: "", details: "" });

  const eggMutation = useMutation({
    mutationFn: addEggLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poultry-batches"] });
      toast.success("Egg collection logged");
      setEggForm({ collection_date: "", eggs_collected: "", broken_eggs: "0" });
    },
    onError: (err) => toastFieldErrors(err, "Could not log eggs"),
  });

  const feedMutation = useMutation({
    mutationFn: addPoultryFeedLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poultry-batches"] });
      toast.success("Feed log added");
      setFeedForm({ feed_date: "", feed_type: "", quantity_kg: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not add feed log"),
  });

  const reportMutation = useMutation({
    mutationFn: addPoultryActivityReport,
    onSuccess: () => {
      toast.success("Report submitted");
      setReportForm({ report_date: "", activity_type: "observation", count_affected: "", details: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not submit report"),
  });

  return (
    <div className="border-t px-4 py-4 bg-gray-50 space-y-6">
      <div className="text-sm text-gray-600">
        {batch.breed && <span className="mr-4">Breed: {batch.breed}</span>}
        <span className="mr-4 capitalize">Gender: {batch.gender}</span>
        {batch.average_size_kg && <span>Avg size: {batch.average_size_kg} kg</span>}
      </div>

      {isChicken && (
        <div className="grid grid-cols-2 gap-6">
          {/* Egg collection - chicken only */}
          <div>
            <h4 className="font-semibold mb-2 text-sm">Egg Collection</h4>
            {canManage && (
              <form
                onSubmit={(e) => { e.preventDefault(); eggMutation.mutate({ batch: batch.id, ...eggForm, eggs_collected: Number(eggForm.eggs_collected), broken_eggs: Number(eggForm.broken_eggs) }); }}
                className="flex gap-2"
              >
                <input type="date" value={eggForm.collection_date} onChange={(e) => setEggForm({ ...eggForm, collection_date: e.target.value })} className="border rounded px-2 py-1 text-sm flex-1" required />
                <input type="number" placeholder="Eggs" value={eggForm.eggs_collected} onChange={(e) => setEggForm({ ...eggForm, eggs_collected: e.target.value })} className="border rounded px-2 py-1 text-sm w-20" required />
                <button type="submit" disabled={eggMutation.isPending} className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">Log</button>
              </form>
            )}
          </div>

          {/* Feed log - chicken only */}
          <div>
            <h4 className="font-semibold mb-2 text-sm">Feed Consumption</h4>
            {canManage && (
              <form
                onSubmit={(e) => { e.preventDefault(); feedMutation.mutate({ batch: batch.id, ...feedForm, quantity_kg: Number(feedForm.quantity_kg) }); }}
                className="space-y-2"
              >
                <input placeholder="Feed type" value={feedForm.feed_type} onChange={(e) => setFeedForm({ ...feedForm, feed_type: e.target.value })} className="border rounded px-2 py-1 text-sm w-full" required />
                <div className="flex gap-2">
                  <input type="date" value={feedForm.feed_date} onChange={(e) => setFeedForm({ ...feedForm, feed_date: e.target.value })} className="border rounded px-2 py-1 text-sm flex-1" required />
                  <input type="number" step="0.01" placeholder="kg" value={feedForm.quantity_kg} onChange={(e) => setFeedForm({ ...feedForm, quantity_kg: e.target.value })} className="border rounded px-2 py-1 text-sm w-20" required />
                </div>
                <button type="submit" disabled={feedMutation.isPending} className="bg-green-600 text-white px-3 py-1 rounded text-sm w-full disabled:opacity-50">Log Feed</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Activity report - all species */}
      <div>
        <h4 className="font-semibold mb-2 text-sm">Report Activity / Mortality</h4>
        <form
          onSubmit={(e) => { e.preventDefault(); reportMutation.mutate({ batch: batch.id, ...reportForm, count_affected: reportForm.count_affected ? Number(reportForm.count_affected) : null }); }}
          className="grid grid-cols-2 gap-2"
        >
          <input type="date" value={reportForm.report_date} onChange={(e) => setReportForm({ ...reportForm, report_date: e.target.value })} className="border rounded px-2 py-1 text-sm" required />
          <select value={reportForm.activity_type} onChange={(e) => setReportForm({ ...reportForm, activity_type: e.target.value })} className="border rounded px-2 py-1 text-sm">
            <option value="observation">Observation</option>
            <option value="health_concern">Health Concern</option>
            <option value="mortality">Mortality</option>
            <option value="hatching">Hatching</option>
          </select>
          <input type="number" placeholder="Count affected (optional)" value={reportForm.count_affected} onChange={(e) => setReportForm({ ...reportForm, count_affected: e.target.value })} className="border rounded px-2 py-1 text-sm col-span-2" />
          <textarea placeholder="Details" value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} className="border rounded px-2 py-1 text-sm col-span-2" required />
          <button type="submit" disabled={reportMutation.isPending} className="bg-green-600 text-white px-3 py-1 rounded text-sm col-span-2 disabled:opacity-50">Submit Report</button>
        </form>
      </div>
    </div>
  );
}