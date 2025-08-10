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
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}

  @Post()
  async create(@Body() dto: { first_name: string; last_name: string }) {
    if (!dto.first_name || !dto.last_name) {
      throw new BadRequestException();
    }
    return this.svc.create(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const client = await this.svc.get(id);
    if (!client) {
      throw new NotFoundException();
    }
    return client;
  }
}