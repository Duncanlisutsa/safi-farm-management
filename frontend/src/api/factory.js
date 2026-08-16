import api from "./axios";

export const getProductionLogs = async () => {
  const res = await api.get("/production-logs/");
  return res.data;
};

export const createProductionLog = async (logData) => {
  const res = await api.post("/production-logs/", logData);
  return res.data;
};

export const getSupplyOrders = async () => {
  const res = await api.get("/orders/");
  return res.data;
};

export const createSupplyOrder = async (orderData) => {
  const res = await api.post("/orders/", orderData);
  return res.data;
};

export const updateSupplyOrderStatus = async (id, status) => {
  const res = await api.patch(`/orders/${id}/`, { status });
  return res.data;
};