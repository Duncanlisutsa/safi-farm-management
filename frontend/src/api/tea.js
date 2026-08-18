import api from "./axios";

export const getTeaLogs = async () => {
  const res = await api.get("/tea-logs/");
  return res.data;
};

export const createTeaLog = async (logData) => {
  const res = await api.post("/tea-logs/", logData);
  return res.data;
};

export const updateTeaLog = async (id, logData) => {
  const res = await api.patch(`/tea-logs/${id}/`, logData);
  return res.data;
};