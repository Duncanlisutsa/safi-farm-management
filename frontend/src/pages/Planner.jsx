import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTaskStatus } from "../api/planner";
import { getUsers } from "../api/accounts";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const CATEGORIES = ["crops", "pigs", "fish", "factory", "tea", "general"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const STATUS_COLORS = {
  scheduled: "bg-gray-200 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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

export default function Planner() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "admin" || user?.role === "farm_manager";

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", assigned_to: "", category: "general",
    week_start_date: "", day_of_week: "monday", notes: "",
  });

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isManager,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      setShowForm(false);
      setForm({ title: "", assigned_to: "", category: "general", week_start_date: "", day_of_week: "monday", notes: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not create task"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Status updated");
    },
    onError: (err) => toastFieldErrors(err, "Could not update status"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, assigned_to: Number(form.assigned_to) });
  };

  if (isLoading) return <Spinner label="Loading tasks..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load tasks. Try refreshing the page.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Work Planner</h1>
        {isManager && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Task"}
          </button>
        )}
      </div>

      {showForm && isManager && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
            required
          />
          <select
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            className="border rounded px-3 py-2"
            required
          >
            <option value="">Select staff member...</option>
            {users?.results?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role.replace("_", " ")})
              </option>
            ))}
          </select>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="date"
            value={form.week_start_date}
            onChange={(e) => setForm({ ...form, week_start_date: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
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
            {createMutation.isPending ? "Creating..." : "Create Task"}
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden overflow-x-auto">
        {tasks?.results?.length === 0 ? (
          <EmptyState icon="📋" title="No tasks yet" subtitle="Create your first task to get started." />
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.results?.map((task) => (
                <tr key={task.id} className="border-t">
                  <td className="px-4 py-3">{task.title}</td>
                  <td className="px-4 py-3">{task.assigned_to_name}</td>
                  <td className="px-4 py-3 capitalize">{task.category}</td>
                  <td className="px-4 py-3 capitalize">{task.day_of_week}</td>
                  <td className="px-4 py-3">
                    {isManager ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    ) : (
                      <select
                        value={task.status}
                        onChange={(e) => statusMutation.mutate({ id: task.id, status: e.target.value })}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${STATUS_COLORS[task.status]}`}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}