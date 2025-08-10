import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}

  @Post()
  async create(@Body() dto: { first_name: string; last_name: string }) {
    if (typeof dto.first_name !== 'string' || typeof dto.last_name !== 'string') {
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

