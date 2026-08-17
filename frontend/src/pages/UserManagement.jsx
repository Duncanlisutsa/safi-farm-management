import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getUsers, createUser, updateUser } from "../api/accounts";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import PasswordInput from "../components/PasswordInput";
import { useAuthStore } from "../store/authStore";

const ROLES = ["admin", "executive", "farm_manager", "farm_attendant", "pig_attendant", "fish_attendant", "factory_worker"];
const EMPTY_FORM = { username: "", email: "", first_name: "", last_name: "", role: "farm_attendant", password: "" };

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

export default function UserManagement() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created");
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toastFieldErrors(err, "Could not create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
      setEditingUser(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update user"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateUser(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
    },
    onError: (err) => toastFieldErrors(err, "Could not update user"),
  });

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      username: u.username, email: u.email || "", first_name: u.first_name || "",
      last_name: u.last_name || "", role: u.role, password: "",
    });
  };

  const submitEdit = (e) => {
    e.preventDefault();
    const payload = { ...editForm };
    if (!payload.password) delete payload.password; // blank = keep current password
    updateMutation.mutate({ id: editingUser.id, data: payload });
  };

  if (isLoading) return <Spinner label="Loading users..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load users. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500">Create staff accounts and manage login credentials.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {showForm ? "Cancel" : "+ New User"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
          className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4"
        >
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border rounded px-3 py-2"
            autoComplete="off"
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Temporary password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded col-span-2 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create User"}
          </button>
        </form>
      )}

      {users?.results?.length === 0 ? (
        <EmptyState icon="👤" title="No users yet" subtitle="Create the first staff account to get started." />
      ) : (
        <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.results?.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email || "—"}</td>
                  <td className="px-4 py-3 capitalize">{u.role.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        disabled={u.id === currentUser?.id}
                        className={`text-xs px-2 py-1 rounded text-white disabled:opacity-40 ${u.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                        title={u.id === currentUser?.id ? "You can't deactivate your own account" : ""}
                      >
                        {u.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editingUser} onClose={() => { setEditingUser(null); setEditForm(null); }}>
        {editForm && (
          <form onSubmit={submitEdit}>
            <h2 className="text-lg font-semibold mb-4">Edit {editingUser.username}</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">First name</label>
                  <input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last name</label>
                  <input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New password</label>
                <PasswordInput
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                  minLength={8}
                />
                <p className="text-xs text-gray-400 mt-1">Leave blank to keep the current password.</p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => { setEditingUser(null); setEditForm(null); }}
                className="flex-1 border rounded py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-green-600 text-white rounded py-2 hover:bg-green-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}