import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles =
      this.reflector.get<Role[]>('roles', context.getHandler()) ||
      this.reflector.get<Role[]>('roles', context.getClass());
    if (!roles || roles.length === 0) {
      return true;
    }
    const req = context.switchToHttp().getRequest();
    const user = (req as any).user as { role: Role } | undefined;
    if (user && roles.includes(user.role)) {
      return true;
    }
    throw new ForbiddenException();
  }
}
