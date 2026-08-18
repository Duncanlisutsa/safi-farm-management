import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProductionLogs, createProductionLog, updateProductionLog,
  getSupplyOrders, createSupplyOrder, updateSupplyOrderStatus, updateSupplyOrder,
} from "../api/factory";
import { useAuthStore } from "../store/authStore";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";
import EditModal from "../components/EditModal";
import RowActions from "../components/RowActions";
import { exportRecordToPdf, PDF_ACCENTS } from "../utils/pdfExport";

const PRODUCTION_LINES = ["nettle_processing", "soya_intake", "dried_vegetables", "soya_oil_flour"];
const OUTPUT_UNITS = ["kg", "litres", "units"];
const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  fulfilled: "bg-green-100 text-green-800",
};

const PRODUCTION_EDIT_FIELDS = [
  { name: "production_line", label: "Production line", type: "select", options: PRODUCTION_LINES.map((l) => ({ value: l, label: l.replace("_", " ") })) },
  { name: "log_date", label: "Date", type: "date", required: true },
  { name: "batch_number", label: "Batch number", type: "text", span: 2 },
  { name: "input_description", label: "Input description", type: "text" },
  { name: "input_quantity_kg", label: "Input quantity (kg)", type: "number", step: "0.01" },
  { name: "output_description", label: "Output description", type: "text" },
  { name: "output_quantity", label: "Output quantity", type: "number", step: "0.01" },
  { name: "output_unit", label: "Output unit", type: "select", options: OUTPUT_UNITS },
  { name: "notes", label: "Notes", type: "textarea", span: 2 },
];
const PRODUCTION_PDF_FIELDS = ["log_date", "production_line", "batch_number", "input_description", "input_quantity_kg", "output_description", "output_quantity", "output_unit", "notes"];

const ORDER_EDIT_FIELDS = [
  { name: "item_name", label: "Item name", type: "text", required: true, span: 2 },
  { name: "quantity_description", label: "Quantity", type: "text", required: true },
  { name: "urgency", label: "Urgency", type: "select", options: ["normal", "urgent"] },
  { name: "reason", label: "Reason", type: "textarea", span: 2 },
];
const ORDER_PDF_FIELDS = ["item_name", "quantity_description", "requested_by_name", "urgency", "status", "reason"];

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

export default function Factory() {
  const [tab, setTab] = useState("production");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Factory</h1>
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab("production")}
          className={`px-4 py-2 font-medium transition-colors ${tab === "production" ? "border-b-2 border-violet-600 text-violet-700" : "text-gray-500"}`}
        >
          Production Logs
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 font-medium transition-colors ${tab === "orders" ? "border-b-2 border-violet-600 text-violet-700" : "text-gray-500"}`}
        >
          Supply Orders
        </button>
      </div>

      {tab === "production" ? <ProductionLogsPanel /> : <SupplyOrdersPanel />}
    </div>
  );
}

function ProductionLogsPanel() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canLog = ["admin", "factory_worker"].includes(user?.role);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    production_line: "nettle_processing", log_date: "", batch_number: "",
    input_description: "", input_quantity_kg: "", output_description: "",
    output_quantity: "", output_unit: "kg", notes: "",
  });
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ["production-logs"],
    queryFn: getProductionLogs,
  });

  const createMutation = useMutation({
    mutationFn: createProductionLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-logs"] });
      toast.success("Production log added");
      setShowForm(false);
      setForm({ production_line: "nettle_processing", log_date: "", batch_number: "", input_description: "", input_quantity_kg: "", output_description: "", output_quantity: "", output_unit: "kg", notes: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not add log"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProductionLog(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-logs"] });
      toast.success("Production log updated");
      setEditingLog(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update log"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (payload.input_quantity_kg) payload.input_quantity_kg = Number(payload.input_quantity_kg);
    else delete payload.input_quantity_kg;
    if (payload.output_quantity) payload.output_quantity = Number(payload.output_quantity);
    else delete payload.output_quantity;
    if (!payload.batch_number) delete payload.batch_number;
    createMutation.mutate(payload);
  };

  const openEdit = (log) => {
    setEditingLog(log);
    setEditForm({ ...log });
  };

  const submitEdit = (values) => {
    const payload = { ...values };
    if (payload.input_quantity_kg) payload.input_quantity_kg = Number(payload.input_quantity_kg);
    else delete payload.input_quantity_kg;
    if (payload.output_quantity) payload.output_quantity = Number(payload.output_quantity);
    else delete payload.output_quantity;
    updateMutation.mutate({ id: editingLog.id, data: payload });
  };

  const downloadPdf = (log) => {
    exportRecordToPdf(
      `production-log-${log.log_date}-${log.id}.pdf`,
      "Production Log",
      `${log.production_line.replace("_", " ")} — ${log.log_date}`,
      log,
      PRODUCTION_PDF_FIELDS,
      PDF_ACCENTS.factory
    );
  };

  if (isLoading) return <Spinner label="Loading production logs..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load production logs. Try refreshing the page.</p>;

  return (
    <div>
      {canLog && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-violet-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-violet-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ Log Production"}
          </button>
        </div>
      )}

      {showForm && canLog && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-violet-500">
          <select
            value={form.production_line}
            onChange={(e) => setForm({ ...form, production_line: e.target.value })}
            className="border rounded px-3 py-2"
          >
            {PRODUCTION_LINES.map((l) => <option key={l} value={l}>{l.replace("_", " ")}</option>)}
          </select>
          <input
            type="date"
            value={form.log_date}
            onChange={(e) => setForm({ ...form, log_date: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <input
            placeholder="Batch number (optional)"
            value={form.batch_number}
            onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
          />
          <input
            placeholder="Input description (e.g. 48 kg raw nettle)"
            value={form.input_description}
            onChange={(e) => setForm({ ...form, input_description: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Input quantity (kg)"
            type="number" step="0.01"
            value={form.input_quantity_kg}
            onChange={(e) => setForm({ ...form, input_quantity_kg: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            placeholder="Output description (e.g. 12 kg packed)"
            value={form.output_description}
            onChange={(e) => setForm({ ...form, output_description: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <input
              placeholder="Output quantity"
              type="number" step="0.01"
              value={form.output_quantity}
              onChange={(e) => setForm({ ...form, output_quantity: e.target.value })}
              className="border rounded px-3 py-2 flex-1"
            />
            <select
              value={form.output_unit}
              onChange={(e) => setForm({ ...form, output_unit: e.target.value })}
              className="border rounded px-3 py-2"
            >
              {OUTPUT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
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
            className="bg-violet-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Saving..." : "Log Production"}
          </button>
        </form>
      )}

      {logs?.results?.length === 0 ? (
        <EmptyState icon="🏭" title="No production logs yet" subtitle="Log your first production batch to get started." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-violet-600 text-white">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Line</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Input</th>
                <th className="px-4 py-3">Output</th>
                {canLog && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {logs?.results?.map((log, i) => (
                <tr key={log.id} className={`border-t hover:bg-violet-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3">{log.log_date}</td>
                  <td className="px-4 py-3 capitalize">{log.production_line.replace("_", " ")}</td>
                  <td className="px-4 py-3">{log.batch_number || "—"}</td>
                  <td className="px-4 py-3">{log.input_description || "—"} {log.input_quantity_kg ? `(${log.input_quantity_kg} kg)` : ""}</td>
                  <td className="px-4 py-3">{log.output_description || "—"} {log.output_quantity ? `(${log.output_quantity} ${log.output_unit})` : ""}</td>
                  {canLog && (
                    <td className="px-4 py-3">
                      <RowActions accent="violet" onEdit={() => openEdit(log)} onDownload={() => downloadPdf(log)} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        open={!!editingLog}
        onClose={() => { setEditingLog(null); setEditForm(null); }}
        title={editingLog ? `Edit Log — ${editingLog.log_date}` : ""}
        fields={PRODUCTION_EDIT_FIELDS}
        values={editForm}
        onChange={setEditForm}
        onSubmit={submitEdit}
        submitting={updateMutation.isPending}
        accent="violet"
      />
    </div>
  );
}

function SupplyOrdersPanel() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const canApprove = ["admin", "farm_manager"].includes(user?.role);
  const canRequest = ["admin", "farm_manager", "farm_attendant", "pig_attendant", "fish_attendant", "factory_worker"].includes(user?.role);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item_name: "", quantity_description: "", urgency: "normal", reason: "" });
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["supply-orders"],
    queryFn: getSupplyOrders,
  });

  const createMutation = useMutation({
    mutationFn: createSupplyOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      toast.success("Order submitted");
      setShowForm(false);
      setForm({ item_name: "", quantity_description: "", urgency: "normal", reason: "" });
    },
    onError: (err) => toastFieldErrors(err, "Could not submit order"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateSupplyOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      toast.success("Order updated");
    },
    onError: (err) => toastFieldErrors(err, "Could not update order"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupplyOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supply-orders"] });
      toast.success("Order updated");
      setEditingOrder(null);
      setEditForm(null);
    },
    onError: (err) => toastFieldErrors(err, "Could not update order"),
  });

  const openEdit = (order) => {
    setEditingOrder(order);
    setEditForm({ ...order });
  };

  const submitEdit = (values) => {
    updateMutation.mutate({ id: editingOrder.id, data: values });
  };

  const downloadPdf = (order) => {
    exportRecordToPdf(
      `supply-order-${order.item_name}-${order.id}.pdf`,
      "Supply Order",
      order.item_name,
      order,
      ORDER_PDF_FIELDS,
      PDF_ACCENTS.factory
    );
  };

  if (isLoading) return <Spinner label="Loading supply orders..." />;
  if (isError) return <p className="text-red-600 text-center py-12">Failed to load supply orders. Try refreshing the page.</p>;

  return (
    <div>
      {canRequest && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-violet-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-violet-700 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Order"}
          </button>
        </div>
      )}

      {showForm && canRequest && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
          className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-2 gap-4 border-t-4 border-violet-500"
        >
          <input
            placeholder="Item name"
            value={form.item_name}
            onChange={(e) => setForm({ ...form, item_name: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
            required
          />
          <input
            placeholder="Quantity (e.g. 2 bags / 50 kg)"
            value={form.quantity_description}
            onChange={(e) => setForm({ ...form, quantity_description: e.target.value })}
            className="border rounded px-3 py-2"
            required
          />
          <select
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
          </select>
          <textarea
            placeholder="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="border rounded px-3 py-2 col-span-2"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-violet-600 text-white px-4 py-2 rounded-md col-span-2 hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Submitting..." : "Submit Order"}
          </button>
        </form>
      )}

      {orders?.results?.length === 0 ? (
        <EmptyState icon="📦" title="No supply orders yet" subtitle="Submit your first order to get started." />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-violet-600 text-white">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                {canApprove && <th className="px-4 py-3">Approval</th>}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders?.results?.map((order, i) => (
                <tr key={order.id} className={`border-t hover:bg-violet-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3">{order.item_name}</td>
                  <td className="px-4 py-3">{order.quantity_description}</td>
                  <td className="px-4 py-3">{order.requested_by_name}</td>
                  <td className="px-4 py-3 capitalize">
                    {order.urgency === "urgent" ? (
                      <span className="text-red-600 font-medium">Urgent</span>
                    ) : "Normal"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  {canApprove && (
                    <td className="px-4 py-3">
                      {order.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => statusMutation.mutate({ id: order.id, status: "approved" })}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: order.id, status: "rejected" })}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {order.status === "approved" && (
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: "fulfilled" })}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <RowActions
                      accent="violet"
                      onEdit={canApprove ? () => openEdit(order) : undefined}
                      onDownload={() => downloadPdf(order)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EditModal
        open={!!editingOrder}
        onClose={() => { setEditingOrder(null); setEditForm(null); }}
        title={editingOrder ? `Edit Order — ${editingOrder.item_name}` : ""}
        fields={ORDER_EDIT_FIELDS}
        values={editForm}
        onChange={setEditForm}
        onSubmit={submitEdit}
        submitting={updateMutation.isPending}
        accent="violet"
      />
    </div>
  );
}