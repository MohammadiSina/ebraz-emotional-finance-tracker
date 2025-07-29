import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Custom decorator to extract the current user from the request object.
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  return GqlExecutionContext.create(context).getContext().req.user;
});
