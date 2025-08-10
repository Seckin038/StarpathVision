import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('owner')
@Controller()
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Post('sessions')
  async create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @Get('sessions/:id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Get('clients/:clientId/sessions')
  async list(@Param('clientId') clientId: string) {
    return this.svc.list(clientId);
  }
}

