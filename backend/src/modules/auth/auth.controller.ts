import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { cfg } from '../../common/config';
import { Role } from '../../common/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('token')
  async token(@Body() dto: { role: Role; password: string }) {
    const expected =
      dto.role === 'owner' ? cfg.auth.ownerPassword : cfg.auth.assistantPassword;
    if (dto.password !== expected) {
      throw new UnauthorizedException();
    }
    return { access_token: this.svc.issue(dto.role) };
  }
}
