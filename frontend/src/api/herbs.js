import api from "./axios";

export const getHerbs = async () => {
  const res = await api.get("/herbs/");
  return res.data;
};

export const createHerb = async (formData) => {
  const res = await api.post("/herbs/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateHerb = async (id, formData) => {
  const res = await api.patch(`/herbs/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getHerbHarvestLogs = async () => {
  const res = await api.get("/herb-harvest-logs/");
  return res.data;
};

export const createHerbHarvestLog = async (logData) => {
  const res = await api.post("/herb-harvest-logs/", logData);
  return res.data;
};