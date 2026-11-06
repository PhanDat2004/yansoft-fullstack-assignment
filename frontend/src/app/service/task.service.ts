import api from "../lib/axios";
import axios from "axios";
import { TaskPayload, Task, TaskListResponse, TaskStatus } from "../types/task";

export interface GetTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: string;
  search?: string;
}

export const taskService = {
  getAll: async (params: GetTasksParams = {}) => {
    const response = await api.get<TaskListResponse>("/tasks", {
      params,
    });

    return response.data;
  },

  create: async (data: TaskPayload) => {
    const response = await api.post<Task>("/tasks", data);

    return response.data;
  },

  update: async (id: string, data: TaskPayload) => {
    const response = await api.patch<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  changeStatus: async (id: string, status: TaskStatus) => {
    const response = await api.patch<Task>(`tasks/${id}/status`, { status });

    return response.data;
  },

  remove: async (id: string) => {
    await api.delete(`/tasks/${id}`);
  },
};
