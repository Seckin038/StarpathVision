import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

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

