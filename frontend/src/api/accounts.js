import api from "./axios";

export const getUsers = async () => {
  const res = await api.get("/users/");
  return res.data;
};

export const createUser = async (userData) => {
  const res = await api.post("/users/", userData);
  return res.data;
};

export const updateUser = async (id, userData) => {
  const res = await api.patch(`/users/${id}/`, userData);
  return res.data;
};