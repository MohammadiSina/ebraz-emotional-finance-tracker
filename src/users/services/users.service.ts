import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { USER_CONSTANT } from '../constants/users.constant';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(createUserInput.password, 12);

    return this.prisma.user.create({
      data: { ...createUserInput, password: hashedPassword },
      omit: { password: true, updatedAt: true },
    });
  }

  async findAll(queryUserInput?: QueryOptionInput) {
    const page = queryUserInput?.page || 1;
    const take = queryUserInput?.take || 3;
    const skip = (page - 1) * take;

    return this.prisma.user.findMany({ take, skip, omit: { password: true, updatedAt: true } });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, omit: { password: true } });
    if (!user) throw new NotFoundException(USER_CONSTANT.ERROR.USER_NOT_FOUND(id));

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, omit: { password: true } });
    if (!user) throw new NotFoundException(USER_CONSTANT.ERROR.USER_NOT_FOUND());

    return user;
  }

  async userExists(email: string): Promise<boolean> {
    return !!(await this.prisma.user.findUnique({ where: { email }, select: { id: true } }));
  }

  // TODO: I guess I should use the updateOrThrow method instead, and use customized error handler for prisma
  async update(id: string, updateUserInput: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
      omit: { password: true },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
      omit: { password: true },
    });
  }
}
