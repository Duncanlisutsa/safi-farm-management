import api from "./axios";

export const getTeaLogs = async () => {
  const res = await api.get("/tea-logs/");
  return res.data;
};

export const createTeaLog = async (logData) => {
  const res = await api.post("/tea-logs/", logData);
  return res.data;
};