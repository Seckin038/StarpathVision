import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('owner')
@Controller('clients')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}

  @Post()
  async create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}

