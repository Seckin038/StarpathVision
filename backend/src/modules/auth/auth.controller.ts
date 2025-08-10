import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { cfg } from '../../common/config';
import { Role } from '../../common/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('token')
  async token(@Body() dto: { role: Role; password: string }) {
    if (dto.role !== 'owner' && dto.role !== 'assistant') {
      throw new UnauthorizedException();
    }
    const expected =
      dto.role === 'owner' ? cfg.auth.ownerPassword : cfg.auth.assistantPassword;
    if (dto.password !== expected) {
      throw new UnauthorizedException();
    }
    return { access_token: this.svc.issue(dto.role) };
  }
}
