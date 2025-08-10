import { Module } from '@nestjs/common';
import { ClientsController } from './modules/clients/clients.controller';
import { ClientsService } from './modules/clients/clients.service';
import { SessionsController } from './modules/sessions/sessions.controller';
import { SessionsService } from './modules/sessions/sessions.service';
import { UploadsController } from './modules/uploads/uploads.controller';
import { UploadsService } from './modules/uploads/uploads.service';
import { VisionController } from './modules/vision/vision.controller';
import { VisionService } from './modules/vision/vision.service';
import { ReadingsController } from './modules/readings/readings.controller';
import { ReadingsService } from './modules/readings/readings.service';
import { StorageService } from './modules/storage/storage.service';
import { EmailController } from './modules/email/email.controller';
import { EmailService } from './modules/email/email.service';
import { PdfService } from './modules/pdf/pdf.service';
import { AuthModule } from './modules/auth/auth.module';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [
    ClientsController,
    SessionsController,
    UploadsController,
    VisionController,
    ReadingsController,
    EmailController,
  ],
  providers: [
    ClientsService,
    SessionsService,
    UploadsService,
    VisionService,
    ReadingsService,
    StorageService,
    EmailService,
    PdfService,
    AuthGuard,
    RolesGuard,
  ],
})
export class AppModule {}

