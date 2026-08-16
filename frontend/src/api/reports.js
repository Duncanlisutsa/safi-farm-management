import api from "./axios";

export const getReportsSummary = async (start, end) => {
  const res = await api.get("/reports/", { params: { start, end } });
  return res.data;
};