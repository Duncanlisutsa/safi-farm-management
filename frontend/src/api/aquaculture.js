import api from "./axios";

export const getPonds = async () => {
  const res = await api.get("/ponds/");
  return res.data;
};

export const createPond = async (pondData) => {
  const res = await api.post("/ponds/", pondData);
  return res.data;
};

export const getPondReports = async (pondId) => {
  const res = await api.get("/pond-reports/", { params: { pond: pondId } });
  return res.data;
};

export const addPondReport = async (reportData) => {
  const res = await api.post("/pond-reports/", reportData);
  return res.data;
};