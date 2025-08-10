import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

@Controller('sessions')
@UseGuards(AuthGuard, RolesGuard)
@Roles('owner', 'assistant')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Post()
  async create(@Body() dto: { client_id: string }) {
    if (!dto?.client_id) {
      throw new BadRequestException();
    }
    return this.svc.create(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const session = await this.svc.get(id);
    if (!session) {
      throw new NotFoundException();
    }
    return session;
  }

  @Get('client/:clientId')
  async listByClient(@Param('clientId') clientId: string) {
    // Delegate fetching of sessions to the service layer
    return this.svc.listByClient(clientId);
  }
}
