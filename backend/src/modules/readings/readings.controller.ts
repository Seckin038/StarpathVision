import { Controller, Get, Param } from '@nestjs/common';
import { ReadingsService } from './readings.service';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly svc: ReadingsService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }
}

