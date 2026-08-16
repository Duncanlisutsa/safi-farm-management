import api from "./axios";

export const getPigs = async () => {
  const res = await api.get("/pigs/");
  return res.data;
};

export const createPig = async (pigData) => {
  const res = await api.post("/pigs/", pigData);
  return res.data;
};

export const addPigWeight = async (weightData) => {
  const res = await api.post("/pig-weights/", weightData);
  return res.data;
};

export const addPigVaccination = async (vaccinationData) => {
  const res = await api.post("/pig-vaccinations/", vaccinationData);
  return res.data;
};

export const getFeedRequests = async () => {
  const res = await api.get("/feed-requests/");
  return res.data;
};

export const createFeedRequest = async (requestData) => {
  const res = await api.post("/feed-requests/", requestData);
  return res.data;
};

export const updateFeedRequestStatus = async (id, status) => {
  const res = await api.patch(`/feed-requests/${id}/`, { status });
  return res.data;
};