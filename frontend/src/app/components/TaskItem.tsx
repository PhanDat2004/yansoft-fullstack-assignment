"use client";
import { Button, Card, Divider, Popconfirm, Tag, Tooltip } from "antd";
import { Task, TaskStatus } from "../types/task";
import { PRIORITY_COLORS, STATUS_COLORS } from "../constants/task-colors";
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

interface TaskItemProps {
  task: Task;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onView: (task: Task) => void;
}

const getNextStatus = (status: TaskStatus): TaskStatus | null => {
  switch (status) {
    case "TODO":
      return "IN_PROGRESS";

    case "IN_PROGRESS":
      return "DONE";

    case "DONE":
      return null;

    default:
      return null;
  }
};

const TaskItem = ({
  task,
  onChangeStatus,
  onEdit,
  onDelete,
  onView,
}: TaskItemProps) => {
  const nextStatus = getNextStatus(task.status);
  return (
    <Card
      styles={{
        body: {
          paddingTop: 12,
          paddingBottom: 12,
        },
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{task.title}</h3>

        <div className="flex shrink-0 gap-2">
          <Tag className={`${STATUS_COLORS[task.status]} !rounded-[8px]`}>
            {task.status}
          </Tag>
          <Tag className={`${PRIORITY_COLORS[task.priority]} !rounded-[8px]`}>
            {task.priority}
          </Tag>
        </div>
      </div>

      <p className="my-2 text-sm text-gray-500">{task.description}</p>
      <p className="text-gray-500">
        Created: {dayjs(task.createdAt).format("DD/MM/YYYY HH:mm")}
      </p>
      <Divider />
      <div className="flex justify-end gap-2">
        <Tooltip title="View">
          <Button
            size="large"
            icon={<EyeOutlined />}
            onClick={() => onView(task)}
          />
        </Tooltip>

        <Tooltip title="Update Task">
          <Button
            type="primary"
            size="large"
            className="!bg-orange-500 hover:!bg-orange-600"
            icon={<EditOutlined style={{ fontSize: 18 }} />}
            onClick={() => onEdit(task)}
          />
        </Tooltip>

        <Tooltip title="Next Status">
          <Button
            type="primary"
            size="large"
            disabled={!nextStatus}
            onClick={() => {
              if (nextStatus) {
                onChangeStatus(task.id, nextStatus);
              }
            }}
            className="!bg-green-600 hover:!bg-green-700"
            icon={<ArrowRightOutlined style={{ fontSize: 18 }} />}
          />
        </Tooltip>

        <Popconfirm
          title="Delete Task"
          description="Are you sure you want to delete this task?"
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(task.id)}
        >
          <Tooltip title="Delete">
            <Button danger size="large" icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </div>
    </Card>
  );
};

export default TaskItem;
