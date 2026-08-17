import api from "./axios";

export const getEmployeeProfiles = async () => {
  const res = await api.get("/employee-profiles/");
  return res.data;
};

export const createEmployeeProfile = async (formData) => {
  const res = await api.post("/employee-profiles/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateEmployeeProfile = async (id, formData) => {
  const res = await api.patch(`/employee-profiles/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};