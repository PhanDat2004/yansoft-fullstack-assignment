"use client";

import { Form, Input, Modal, Select } from "antd";
import type { TaskPayload, Task } from "../types/task";
import { useEffect } from "react";

const { TextArea } = Input;

interface TaskModalProps {
  open: boolean;
  loading: boolean;
  task: Task | null;
  onCancel: () => void;
  onSubmit: (values: TaskPayload) => void;
}

const TaskModal = ({
  open,
  loading,
  onCancel,
  onSubmit,
  task,
}: TaskModalProps) => {
  const [form] = Form.useForm<TaskPayload>();

  useEffect(() => {
    if (open) {
      if (task) {
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          priority: task.priority,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, task, form]);

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = (values: TaskPayload) => {
    onSubmit(values);
  };

  return (
    <Modal
      title={task ? "Update task" : "Create new task"}
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Submit"
      cancelText="Cancel"
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priority: "MEDIUM",
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Task Title"
          name="title"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "Title is required!",
            },
            {
              max: 100,
              message: "Title cannot exceed 100 characters!",
            },
          ]}
        >
          <Input placeholder="Enter task title" maxLength={100} showCount />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <TextArea placeholder="Enter task description..." rows={4} />
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority"
          rules={[
            {
              required: true,
              message: "Please select priority!",
            },
          ]}
        >
          <Select
            options={[
              { label: "Low", value: "LOW" },
              { label: "Medium", value: "MEDIUM" },
              { label: "High", value: "HIGH" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TaskModal;
