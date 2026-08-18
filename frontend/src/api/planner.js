import api from "./axios";

export const getTasks = async (params = {}) => {
  const res = await api.get("/tasks/", { params });
  return res.data;
};

export const createTask = async (taskData) => {
  const res = await api.post("/tasks/", taskData);
  return res.data;
};

export const updateTaskStatus = async (id, status) => {
  const res = await api.patch(`/tasks/${id}/`, { status });
  return res.data;
};

export const updateTask = async (id, taskData) => {
  const res = await api.patch(`/tasks/${id}/`, taskData);
  return res.data;
};