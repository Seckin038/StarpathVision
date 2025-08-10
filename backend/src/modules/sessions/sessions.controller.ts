import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sessions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('manager')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Post()
  async create(@Body() dto: { client_id: string }) {
    return this.svc.create(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Get('client/:clientId')
  async listByClient(@Param('clientId') clientId: string) {
    return this.svc.listByClient(clientId);
  }
}
