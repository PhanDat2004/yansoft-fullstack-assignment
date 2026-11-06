import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from 'src/generated/prisma/enums';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

type MockTask = {
  id: string;
  status: TaskStatus;
};

describe('TasksService', () => {
  let service: TasksService;

  const mockPrisma = {
    task: {
      create: jest.fn(),
      findUnique: jest.fn<() => Promise<MockTask | null>>(),
      update: jest.fn(),
      updateMany: jest.fn<() => Promise<{ count: number }>>(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new TasksService(mockPrisma as unknown as PrismaService);
  });

  // 1. Test chuyển trạng thái
  describe('changeStatus', () => {
    it('should change TODO to IN_PROGRESS successfully', async () => {
      mockPrisma.task.findUnique
        .mockResolvedValueOnce({
          id: '1',
          status: 'TODO',
        })
        .mockResolvedValueOnce({
          id: '1',
          status: 'IN_PROGRESS',
        });

      mockPrisma.task.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.changeStatus('1', {
        status: 'IN_PROGRESS',
      });

      expect(result.status).toBe('IN_PROGRESS');

      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          id: '1',
          status: 'TODO',
        },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    });

    it('should reject TODO to DONE', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'TODO',
      });

      await expect(
        service.changeStatus('1', {
          status: 'DONE',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.task.updateMany).not.toHaveBeenCalled();
    });

    it('should change IN_PROGRESS to DONE successfully', async () => {
      mockPrisma.task.findUnique
        .mockResolvedValueOnce({
          id: '1',
          status: 'IN_PROGRESS',
        })
        .mockResolvedValueOnce({
          id: '1',
          status: 'DONE',
        });

      mockPrisma.task.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.changeStatus('1', {
        status: 'DONE',
      });

      expect(result.status).toBe('DONE');

      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          id: '1',
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'DONE',
        },
      });
    });

    it('should reject DONE to IN_PROGRESS', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: '1',
        status: 'DONE',
      });

      await expect(
        service.changeStatus('1', {
          status: 'IN_PROGRESS',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.task.updateMany).not.toHaveBeenCalled();
    });
  });

  // 2. Test validate title
  describe('validate title', () => {
    it('should reject empty title', async () => {
      await expect(
        Promise.resolve().then(() => service.create({ title: '' } as any)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject whitespace-only title', async () => {
      await expect(
        Promise.resolve().then(() => service.create({ title: '   ' } as any)),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject title longer than 100 characters', async () => {
      await expect(
        Promise.resolve().then(() =>
          service.create({ title: 'a'.repeat(101) } as any),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
