import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ListTaskDto } from './dto/list-task.dto';

import { TaskStatus } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: null,
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private validateTitle(title: string): string {
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      throw new BadRequestException('Title must not be empty');
    }

    if (normalizedTitle.length > 100) {
      throw new BadRequestException('Title must not exceed 100 characters');
    }

    return normalizedTitle;
  }

  async create(dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: this.validateTitle(dto.title),
        description: dto.description,
        priority: dto.priority,
      },
    });
  }

  async findAll(query: ListTaskDto) {
    const { page, limit, status, priority, search } = query;

    const where: Prisma.TaskWhereInput = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task is not found');
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findOne(id);

    return this.prisma.task.update({
      where: { id },
      data: {
        title:
          dto.title !== undefined ? this.validateTitle(dto.title) : undefined,
        description: dto.description,
        priority: dto.priority,
      },
    });
  }

  async changeStatus(id: string, dto: ChangeStatusDto) {
    const task = await this.findOne(id);

    if (NEXT_STATUS[task.status] !== dto.status) {
      throw new BadRequestException(
        `Cannot change status from ${task.status} to ${dto.status}`,
      );
    }

    const result = await this.prisma.task.updateMany({
      where: {
        id,
        status: task.status,
      },
      data: {
        status: dto.status,
      },
    });

    if (result.count === 0) {
      return this.findOne(id);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.prisma.task.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      throw new NotFoundException('Task is not found');
    }
  }
}
