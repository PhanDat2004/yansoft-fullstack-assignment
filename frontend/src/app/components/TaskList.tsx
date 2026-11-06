"use client";

import { useEffect, useState } from "react";
import { Alert, Spin, Empty, Pagination, Select } from "antd";

import TaskItem from "./TaskItem";
import type { Task, TaskStatus } from "../types/task";
import { taskService } from "../service/task.service";

interface TaskListProps {
  refreshKey: number;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView: (task: Task) => void;
}

const PAGE_SIZE = 10;

const TaskList = ({
  refreshKey,
  onChangeStatus,
  onEdit,
  onDelete,
  onView,
}: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await taskService.getAll({
          page: currentPage,
          limit: PAGE_SIZE,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        });

        setTasks(response.data);
        setTotal(response.meta.total);

        // Nếu trang hiện tại không còn dữ liệu sau khi xóa
        if (
          response.data.length === 0 &&
          currentPage > 1 &&
          currentPage > response.meta.totalPages
        ) {
          setCurrentPage(response.meta.totalPages || 1);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch tasks",
        );
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [refreshKey, currentPage, statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Select
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          className="w-48"
          options={[
            { label: "All Status", value: "ALL" },
            { label: "To Do", value: "TODO" },
            { label: "In Progress", value: "IN_PROGRESS" },
            { label: "Done", value: "DONE" },
          ]}
        />
      </div>
      {tasks.length === 0 ? (
        <Empty description="No tasks found" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onChangeStatus={onChangeStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="mt-6 flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default TaskList;
