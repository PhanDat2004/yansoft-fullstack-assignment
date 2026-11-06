"use client";

import { Modal, Tag, Descriptions } from "antd";
import type { Task } from "../types/task";
import dayjs from "dayjs";
import { PRIORITY_COLORS, STATUS_COLORS } from "../constants/task-colors";

interface TaskDetailModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}

const TaskDetailModal = ({ open, task, onClose }: TaskDetailModalProps) => {
  if (!task) return null;

  return (
    <Modal
      title="Task Details"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Title">{task.title}</Descriptions.Item>

        <Descriptions.Item label="Description">
          {task.description || "No description"}
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          <Tag className={STATUS_COLORS[task.status]}>{task.status}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Priority">
          <Tag className={PRIORITY_COLORS[task.priority]}>{task.priority}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {dayjs(task.createdAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>

        <Descriptions.Item label="Updated At">
          {dayjs(task.updatedAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default TaskDetailModal;
