import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from 'generated/prisma';

import { HashService } from '../../auth/services/hash.service';
import { QueryOptionInput } from '../../common/dto/query-option.input';
import { PrismaService } from '../../common/services/prisma.service';
import { TransactionsService } from '../../transactions/services/transactions.service';
import { USER_CONSTANT } from '../constants/users.constant';
import { CreateUserInput } from '../dto/create-user.input';
import { UpdateUserCredentialInput } from '../dto/update-user-credential.input';
import { UpdateUserInput } from '../dto/update-user.input';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(createUserInput: CreateUserInput) {
    const hashedPassword = await this.hashService.hashPassword(createUserInput.password);

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

  // Internal Usage Only
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, createdAt: true, role: true },
    });
  }

  // Internal Usage Only
  async findUsersEligibleForInsights(minInsightTransactions: number, period?: string) {
    const grouped = await this.transactionsService.findUsersWithMinimumTransactions(minInsightTransactions, period);
    const userIds = grouped.map((g) => g.userId);

    return this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } });
  }

  // Internal Usage Only
  async userExists(email: string): Promise<boolean> {
    return !!(await this.prisma.user.findUnique({ where: { email }, select: { id: true } }));
  }

  async update(id: string, updateUserInput: UpdateUserInput, user: User) {
    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = user.id === id;

    // Authorization checks
    if (!isAdmin && !isOwner) throw new ForbiddenException(USER_CONSTANT.ERROR.UPDATE_DENIED);
    if (!isAdmin && updateUserInput.role) throw new ForbiddenException(USER_CONSTANT.ERROR.UPDATE_ROLE_DENIED);

    // Verify user exists, if admins are the commanders
    if (isAdmin) await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserInput,
      omit: { password: true },
    });
  }

  async updateCredential(id: string, updateUserCredentialInput: UpdateUserCredentialInput, user: User) {
    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = user.id === id;

    // Authorization checks
    if (!isAdmin && !isOwner) throw new ForbiddenException(USER_CONSTANT.ERROR.UPDATE_DENIED);

    // Verify user exists, if admins are the commanders
    if (isAdmin) await this.findOne(id);

    // Hash the password
    const hashedPassword = await this.hashService.hashPassword(updateUserCredentialInput.password);

    return this.prisma.user.update({
      where: { id },
      data: { ...updateUserCredentialInput, password: hashedPassword },
      omit: { password: true },
    });
  }

  async remove(id: string, user: User) {
    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = user.id === id;

    // Authorization checks
    if (!isAdmin && !isOwner) throw new ForbiddenException(USER_CONSTANT.ERROR.REMOVE_DENIED);

    // Verify user exists, if admins are the commanders
    if (isAdmin) await this.findOne(id);

    return this.prisma.user.delete({
      where: { id },
      omit: { password: true },
    });
  }
}
