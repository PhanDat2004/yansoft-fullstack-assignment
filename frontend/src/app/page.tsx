"use client";

import { useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import type { TaskPayload, Task, TaskStatus } from "./types/task";

import { taskService } from "./service/task.service";
import TaskDetailModal from "./components/TaskDetailModal";

const HomePage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // Open modal
  const handleOpenModal = () => {
    setOpenModal(true);
  };


  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setOpenDetail(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedTask(null);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedTask(null);
  };

  // Create task
  const handleSubmitTask = async (values: TaskPayload) => {
    try {
      setCreating(true);

      if (selectedTask) {
        await taskService.update(selectedTask.id, values);
        message.success("Task updated successfully!");
      } else {
        await taskService.create(values);
        message.success("Task created successfully!");
      }

      setOpenModal(false);
      setSelectedTask(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Submit task error:", error);

      message.error(
        error instanceof Error ? error.message : "Failed to submit task!",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setOpenModal(true);
  };

  // Change Status
  const handleChangeStatus = async (id: string, status: TaskStatus) => {
    try {
      await taskService.changeStatus(id, status);
      message.success("Task status updated successfully!");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to update task status!",
      );
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.remove(id);

      message.success("Task deleted successfully!");

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Delete task error:", error);

      message.error(
        error instanceof Error ? error.message : "Failed to delete task!",
      );
    }
  };

  return (
    <main className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Management</h1>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
        >
          Create Task
        </Button>
      </div>

      {/* Task List */}
      <TaskList
        refreshKey={refreshKey}
        onChangeStatus={handleChangeStatus}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onView={handleViewTask}
      />

      {/* Create Task Modal */}
      <TaskModal
        open={openModal}
        loading={creating}
        task={selectedTask}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitTask}
      />

      <TaskDetailModal
        open={openDetail}
        task={selectedTask}
        onClose={handleCloseDetail}
      />
    </main>
  );
};

export default HomePage;
