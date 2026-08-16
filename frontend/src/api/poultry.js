import api from "./axios";

export const getPoultryBatches = async () => {
  const res = await api.get("/poultry-batches/");
  return res.data;
};

export const createPoultryBatch = async (batchData) => {
  const res = await api.post("/poultry-batches/", batchData);
  return res.data;
};

export const addEggLog = async (logData) => {
  const res = await api.post("/egg-logs/", logData);
  return res.data;
};

export const addPoultryFeedLog = async (logData) => {
  const res = await api.post("/poultry-feed-logs/", logData);
  return res.data;
};

export const addPoultryActivityReport = async (reportData) => {
  const res = await api.post("/poultry-reports/", reportData);
  return res.data;
};