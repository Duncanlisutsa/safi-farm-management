import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getProductionLogs, createProductionLog,
  getSupplyOrders, createSupplyOrder, updateSupplyOrderStatus,
} from "../api/factory";
import { useAuthStore } from "../store/authStore";

const PRODUCTION_LINES = ["nettle_processing", "soya_intake", "dried_vegetables", "soya_oil_flour"];
const OUTPUT_UNITS = ["kg", "litres", "units"];
const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  fulfilled: "bg-green-100 text-green-800",
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

export default function Factory() {
  const [tab, setTab] = useState("production");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Factory</h1>
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab("production")}
          className={`px-4 py-2 font-medium ${tab === "production" ? "border-b-2 border-green-600 text-green-700" : "text-gray-500"}`}
        >
          Production Logs
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 font-medium ${tab === "orders" ? "border-b-2 border-green-600 text-green-700" : "text-gray-500"}`}
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

  if (isLoading) return <p>Loading production logs...</p>;
  if (isError) return <p className="text-red-600">Failed to load production logs.</p>;

  return (
    <div>
      {canLog && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ Log Production"}
          </button>
        </div>
      )}

      {showForm && canLog && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
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
            className="bg-green-600 text-white px-4 py-2 rounded col-span-2 disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Log Production"}
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Line</th>
              <th className="px-4 py-3">Batch</th>
              <th className="px-4 py-3">Input</th>
              <th className="px-4 py-3">Output</th>
            </tr>
          </thead>
          <tbody>
            {logs?.results?.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-4 py-3">{log.log_date}</td>
                <td className="px-4 py-3 capitalize">{log.production_line.replace("_", " ")}</td>
                <td className="px-4 py-3">{log.batch_number || "—"}</td>
                <td className="px-4 py-3">{log.input_description || "—"} {log.input_quantity_kg ? `(${log.input_quantity_kg} kg)` : ""}</td>
                <td className="px-4 py-3">{log.output_description || "—"} {log.output_quantity ? `(${log.output_quantity} ${log.output_unit})` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs?.results?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No production logs yet.</p>
        )}
      </div>
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

  if (isLoading) return <p>Loading supply orders...</p>;
  if (isError) return <p className="text-red-600">Failed to load supply orders.</p>;

  return (
    <div>
      {canRequest && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showForm ? "Cancel" : "+ New Order"}
          </button>
        </div>
      )}

      {showForm && canRequest && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
          className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4"
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
            className="bg-green-600 text-white px-4 py-2 rounded col-span-2 disabled:opacity-50"
          >
            {createMutation.isPending ? "Submitting..." : "Submit Order"}
          </button>
        </form>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Requested By</th>
              <th className="px-4 py-3">Urgency</th>
              <th className="px-4 py-3">Status</th>
              {canApprove && <th className="px-4 py-3">Action</th>}
            </tr>
          </thead>
          <tbody>
            {orders?.results?.map((order) => (
              <tr key={order.id} className="border-t">
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
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ id: order.id, status: "rejected" })}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {order.status === "approved" && (
                      <button
                        onClick={() => statusMutation.mutate({ id: order.id, status: "fulfilled" })}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {orders?.results?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No supply orders yet.</p>
        )}
      </div>
    </div>
  );
}