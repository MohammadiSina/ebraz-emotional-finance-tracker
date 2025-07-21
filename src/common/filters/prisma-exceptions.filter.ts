import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { Prisma } from 'generated/prisma';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements GqlExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const { req } = gqlHost.getContext();
    const { code, meta } = exception;

    // Log detailed error for debugging
    // console.error(`Prisma error (${code}):`, exception);

    // Format the error response
    const { status, message } = this.formatPrismaError(code, meta);

    // Return a GraphQL-friendly error response using HttpException
    return new HttpException({ statusCode: status, message, path: req?.url || 'unknown' }, status);
  }

  private formatPrismaError(code: string, meta: Record<string, any> | undefined): { status: number; message: string } {
    switch (code) {
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found.',
        };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: `Unique constraint failed on the field: ${meta?.target || 'unknown'}`,
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: `Foreign key constraint failed on the field: ${meta?.field_name || 'unknown'}`,
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred.',
        };
    }
  }
}
