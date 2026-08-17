import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getEmployeeProfiles, createEmployeeProfile } from "../api/employees";
import { getUsers } from "../api/accounts";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

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

export default function Employees() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canEdit = user?.role === "admin";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    user: "", phone_number: "", bank_account_number: "", kra_pin: "", id_document: null, notes: "",
  });

  const { data: profiles, isLoading, isError } = useQuery({
    queryKey: ["employee-profiles"],
    queryFn: getEmployeeProfiles,
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: canEdit,
  });

  const createMutation = useMutation({
    mutationFn: createEmployeeProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-profiles"] });
      toast.success("Employee record added");
      setShowForm(false);
      setForm({ user: "", phone_number: "", bank_account_number: "", kra_pin: "", id_document: null, notes: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not add employee record"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== "") data.append(key, value);
    });
    createMutation.mutate(data);
  };

  // Users who don't already have an employee profile
  const profiledUserIds = new Set(profiles?.results?.map((p) => p.user) || []);
  const availableUsers = users?.results?.filter((u) => !profiledUserIds.has(u.id)) || [];

  if (isLoading) return <Spinner label="Loading employee records..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load employee records. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Records</h1>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Employee Record"}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        🔒 Contains sensitive information. Visible to Admin and Executive only.
      </p>

      {showForm && canEdit && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <select
            value={form.user}
            onChange={(e) => setForm({ ...form, user: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
            required
          >
            <option value="">Select staff member...</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role.replace("_", " ")})
              </option>
            ))}
          </select>
          <input
            placeholder="Phone number"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            placeholder="Bank account number (optional)"
            value={form.bank_account_number}
            onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="KRA PIN (optional)"
            value={form.kra_pin}
            onChange={(e) => setForm({ ...form, kra_pin: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1">ID document (optional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setForm({ ...form, id_document: e.target.files[0] })}
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
            {createMutation.isPending ? "Saving..." : "Add Employee Record"}
          </button>
        </form>
      )}

      {profiles?.results?.length === 0 ? (
        <EmptyState icon="🆔" title="No employee records yet" subtitle="Add your first employee record to get started." />
      ) : (
        <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">KRA PIN</th>
                <th className="px-4 py-3">ID Document</th>
              </tr>
            </thead>
            <tbody>
              {profiles?.results?.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.full_name}</td>
                  <td className="px-4 py-3 capitalize">{p.role.replace("_", " ")}</td>
                  <td className="px-4 py-3">{p.phone_number}</td>
                  <td className="px-4 py-3">{p.bank_account_number || "—"}</td>
                  <td className="px-4 py-3">{p.kra_pin || "—"}</td>
                  <td className="px-4 py-3">
                    {p.id_document ? (
                      <a href={p.id_document} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                      </a>
                    ) : "—"}
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