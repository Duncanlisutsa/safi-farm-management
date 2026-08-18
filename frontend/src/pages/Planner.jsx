import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTaskStatus, updateTask } from "../api/planner";
import { getUsers } from "../api/accounts";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import EditModal from "../components/EditModal";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const DEPARTMENTS = [
  { value: "crops", label: "Crops" },
  { value: "tea", label: "Tea" },
  { value: "pigs", label: "Pigs" },
  { value: "poultry", label: "Poultry" },
  { value: "fish", label: "Aquaculture" },
  { value: "factory", label: "Factory" },
  { value: "general", label: "General" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_INDEX = Object.fromEntries(DAYS.map((d, i) => [d, i]));

const STATUSES = [
  { value: "pending", label: "Pending", color: "bg-gray-200 text-gray-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "carried_forward", label: "Carried Forward", color: "bg-yellow-100 text-yellow-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];
const STATUS_META = Object.fromEntries(STATUSES.map((s) => [s.value, s]));
const ACTION_STATUSES = STATUSES.filter((s) => s.value !== "pending");

const EDIT_FIELDS = [
  { name: "title", label: "Task title", type: "text", required: true, span: 2 },
  { name: "category", label: "Department", type: "select", options: DEPARTMENTS },
  { name: "day_of_week", label: "Day", type: "select", options: DAYS.map((d) => ({ value: d, label: d })) },
  { name: "status", label: "Status", type: "select", options: STATUSES.map((s) => ({ value: s.value, label: s.label })) },
  { name: "notes", label: "Notes", type: "textarea", span: 2 },
];

const PDF_FIELDS = ["title", "assigned_to_name", "category", "day_of_week", "status", "notes"];

function getMondayISO(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

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

function StatusControl({ task, canEdit, onChange }) {
  const meta = STATUS_META[task.status] ?? STATUSES[0];

  if (!canEdit) {
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${meta.color}`}>
        {meta.label}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className={`text-xs px-2 py-1 rounded-full ${meta.color}`}>
        {meta.label}
      </span>
      <div className="flex gap-1">
        {ACTION_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            disabled={task.status === s.value}
            onClick={() => onChange(task.id, s.value)}
            className={`text-xs px-2 py-1 rounded border transition-colors
              ${task.status === s.value
                ? "opacity-40 cursor-default border-gray-200"
                : "border-gray-300 hover:bg-gray-100 cursor-pointer"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentTable({ department, tasks, currentUserId, isManager, onStatusChange, onEdit, onDownload }) {
  const sorted = [...tasks].sort((a, b) => DAY_INDEX[a.day_of_week] - DAY_INDEX[b.day_of_week]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-4 py-3 bg-fuchsia-700 text-white font-semibold">
        {department.label}
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500 px-4 py-4">No tasks scheduled this week.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((task, i) => {
                const canEdit = isManager || Number(task.assigned_to) === Number(currentUserId);
                return (
                  <tr key={task.id} className={`border-t align-top hover:bg-fuchsia-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-4 py-3">{task.title}</td>
                    <td className="px-4 py-3">{task.assigned_to_name}</td>
                    <td className="px-4 py-3 capitalize">{task.day_of_week}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{task.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusControl task={task} canEdit={canEdit} onChange={onStatusChange} />
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        accent="fuchsia"
                        onEdit={isManager ? () => onEdit(task) : undefined}
                        onDownload={() => onDownload(task)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Planner() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isManager = user?.role === "admin" || user?.role === "farm_manager";

  const [weekStart, setWeekStart] = useState(getMondayISO(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", assigned_to: "", category: "general",
    week_start_date: weekStart, day_of_week: "monday", notes: "",
  });
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ["tasks", weekStart],
    queryFn: () => getTasks({ week_start_date: weekStart }),
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
      setForm({ title: "", assigned_to: "", category: "general", week_start_date: weekStart, day_of_week: "monday", notes: "" });
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
      setEditingTask(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update task"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, week_start_date: weekStart, assigned_to: Number(form.assigned_to) });
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({ ...task });
  };

  const submitEdit = (values) => {
    updateMutation.mutate({
      id: editingTask.id,
      data: { title: values.title, category: values.category, day_of_week: values.day_of_week, status: values.status, notes: values.notes },
    });
  };

  const downloadPdf = (task) => {
    exportRecordToPdf(
      `task-${task.title}-${task.id}.pdf`,
      "Task Record",
      `${task.title} — Week of ${weekStart}`,
      task,
      PDF_FIELDS,
      PDF_ACCENTS.planner
    );
  };

  const tasksByDepartment = useMemo(() => {
    const map = Object.fromEntries(DEPARTMENTS.map((d) => [d.value, []]));
    (tasks?.results ?? []).forEach((task) => {
      if (map[task.category]) map[task.category].push(task);
    });
    return map;
  }, [tasks]);

  if (isLoading) return <Spinner label="Loading tasks..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load tasks. Try refreshing the page.</p>;

  const totalTasks = tasks?.results?.length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Work Planner</h1>
          <p className="text-sm text-gray-500">Week of {weekStart}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(getMondayISO(e.target.value))}
            className="border rounded px-3 py-2"
          />
          {isManager && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-fuchsia-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-fuchsia-700 transition-colors"
            >
              {showForm ? "Cancel" : "+ New Task"}
            </button>
          )}
        </div>
      </div>

      {showForm && isManager && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-fuchsia-500">
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
            {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {DAYS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
          </select>
          <div className="border rounded px-3 py-2 bg-gray-50 text-sm text-gray-500 flex items-center">
            Week of {weekStart}
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
            className="bg-fuchsia-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-fuchsia-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Creating..." : "Create Task"}
          </button>
        </form>
      )}

      {totalTasks === 0 ? (
        <EmptyState icon="📋" title="No tasks this week" subtitle="Create a task above to start planning the week." />
      ) : (
        DEPARTMENTS.map((department) => (
          <DepartmentTable
            key={department.value}
            department={department}
            tasks={tasksByDepartment[department.value]}
            currentUserId={user?.id}
            isManager={isManager}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            onEdit={openEdit}
            onDownload={downloadPdf}
          />
        ))
      )}

      <EditModal
        open={!!editingTask}
        onClose={() => { setEditingTask(null); setEditForm(null); }}
        title={editingTask ? `Edit Task — ${editingTask.title}` : ""}
        fields={EDIT_FIELDS}
        values={editForm}
        onChange={setEditForm}
        onSubmit={submitEdit}
        submitting={updateMutation.isPending}
        accent="fuchsia"
      />
    </div>
  );
}