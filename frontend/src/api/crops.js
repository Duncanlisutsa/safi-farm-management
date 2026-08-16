import api from "./axios";

export const getCrops = async () => {
  const res = await api.get("/crops/");
  return res.data;
};

export const createCrop = async (formData) => {
  const res = await api.post("/crops/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getProduceReports = async () => {
  const res = await api.get("/produce-reports/");
  return res.data;
};

export const createProduceReport = async (reportData) => {
  const res = await api.post("/produce-reports/", reportData);
  return res.data;
};