import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { PrismaExceptionFilter } from './filters/prisma-exceptions.filter';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaExceptionFilter,
    {
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
  ],
  exports: [PrismaService],
})
export class CommonModule {}
