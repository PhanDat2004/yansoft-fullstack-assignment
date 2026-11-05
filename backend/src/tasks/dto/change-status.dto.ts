import { IsEnum } from 'class-validator';
import { TaskStatus } from 'src/generated/prisma/enums';

export class ChangeStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
