import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReadingsService } from './readings.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('owner', 'assistant')
@Controller('readings')
export class ReadingsController {
  constructor(private readonly svc: ReadingsService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}

