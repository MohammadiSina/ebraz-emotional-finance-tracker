import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'generated/prisma';

// This decorator is used to set the roles metadata for a route handler to
// indicate which roles are allowed to access the route.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
