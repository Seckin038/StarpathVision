import { SetMetadata } from '@nestjs/common';

export type Role = string;
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
