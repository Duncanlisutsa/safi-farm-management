import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getPigs, createPig, updatePig, addPigWeight, addPigVaccination } from "../api/pigs";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import EditModal from "../components/EditModal";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const SEX_OPTIONS = ["boar", "sow", "gilt", "barrow"];
const STATUS_OPTIONS = ["active", "sold", "deceased"];
const STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  sold: "bg-blue-100 text-blue-800",
  deceased: "bg-gray-200 text-gray-600",
};

const EDIT_FIELDS = [
  { name: "tag_id", label: "Tag ID", type: "text", required: true },
  { name: "breed", label: "Breed", type: "text", required: true },
  { name: "sex", label: "Sex", type: "select", options: SEX_OPTIONS },
  { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
  { name: "dob", label: "Date of birth", type: "date" },
  { name: "acquisition_date", label: "Acquisition date", type: "date" },
  { name: "notes", label: "Notes", type: "textarea", span: 2 },
];

const PDF_FIELDS = ["tag_id", "breed", "sex", "status", "dob", "acquisition_date", "notes"];

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
  const [editingPig, setEditingPig] = useState(null);
  const [editForm, setEditForm] = useState(null);

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pigs"] });
      toast.success("Pig updated");
      setEditingPig(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update pig"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.dob) delete payload.dob;
    if (!payload.acquisition_date) delete payload.acquisition_date;
    createMutation.mutate(payload);
  };

  const openEdit = (pig) => {
    setEditingPig(pig);
    setEditForm({ ...pig });
  };

  const submitEdit = (values) => {
    const payload = { ...values };
    delete payload.weights;
    delete payload.vaccinations;
    if (!payload.dob) delete payload.dob;
    if (!payload.acquisition_date) delete payload.acquisition_date;
    updateMutation.mutate({ id: editingPig.id, data: payload });
  };

  const downloadPdf = (pig) => {
    exportRecordToPdf(
      `pig-${pig.tag_id}.pdf`,
      "Pig Record",
      `${pig.tag_id} — ${pig.breed}`,
      pig,
      PDF_FIELDS,
      PDF_ACCENTS.pigs
    );
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
            className="bg-rose-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-rose-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Pig"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-rose-500">
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
            className="bg-rose-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Saving..." : "Add Pig"}
          </button>
        </form>
      )}

      {pigs?.results?.length === 0 ? (
        <EmptyState icon="🐷" title="No pigs recorded yet" subtitle="Add your first pig to start tracking." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-rose-600 text-white">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Tag ID</th>
                <th className="px-4 py-3">Breed</th>
                <th className="px-4 py-3">Sex</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pigs?.results?.map((pig, i) => (
                <Fragment key={pig.id}>
                  <tr
                    className={`border-t hover:bg-rose-50/60 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    onClick={() => setExpandedId(expandedId === pig.id ? null : pig.id)}
                  >
                    <td className="px-4 py-3 text-gray-400">{expandedId === pig.id ? "▾" : "▸"}</td>
                    <td className="px-4 py-3 font-medium">{pig.tag_id}</td>
                    <td className="px-4 py-3">{pig.breed}</td>
                    <td className="px-4 py-3 capitalize">{pig.sex}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[pig.status]}`}>
                        {pig.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        accent="rose"
                        onEdit={canManage ? () => openEdit(pig) : undefined}
                        onDownload={() => downloadPdf(pig)}
                      />
                    </td>
                  </tr>
                  {expandedId === pig.id && (
                    <tr>
                      <td colSpan={6} className="p-0 border-t">
                        <PigDetail pig={pig} canManage={canManage} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        open={!!editingPig}
        onClose={() => { setEditingPig(null); setEditForm(null); }}
        title={editingPig ? `Edit ${editingPig.tag_id}` : ""}
        fields={EDIT_FIELDS}
        values={editForm}
        onChange={setEditForm}
        onSubmit={submitEdit}
        submitting={updateMutation.isPending}
        accent="rose"
      />
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
    <div className="px-4 py-4 bg-rose-50/40 grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold mb-2 text-sm text-rose-800">Weight History</h4>
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
              className="bg-rose-600 text-white px-3 py-1 rounded text-sm hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </form>
        )}
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm text-rose-800">Vaccinations</h4>
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
              className="bg-rose-600 text-white px-3 py-1 rounded text-sm w-full hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              Record Vaccination
            </button>
          </form>
        )}
      </div>
    </div>
  );
}