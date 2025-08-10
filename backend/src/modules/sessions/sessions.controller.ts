import { Controller, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/roles.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('owner')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}
}

