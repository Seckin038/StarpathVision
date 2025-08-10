import { SetMetadata } from '@nestjs/common';

export type Role = 'owner' | 'assistant';
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
