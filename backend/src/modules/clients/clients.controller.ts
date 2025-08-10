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
import { ClientsService } from './clients.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(AuthGuard, RoleGuard)
@Roles('client')
@Controller('clients')
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
    if (!client) throw new NotFoundException();
    return client;
  }
}

