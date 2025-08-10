import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReadingsService } from './readings.service';

@Controller('readings')
export class ReadingsController {
  constructor(private readonly svc: ReadingsService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  async createFromVision(@Body() body: { cards: { name: string; orientation: string }[] }) {
    return this.svc.createFromVision(body.cards);
  }
}

