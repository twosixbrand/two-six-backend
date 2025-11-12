import { Module } from '@nestjs/common';
import { UserAppService } from './user-app.service';
import { UserAppController } from './user-app.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserAppController],
  providers: [UserAppService],
})
export class UserAppModule {}
