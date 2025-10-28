import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ErrorLogModule } from './api/error-log/error-log.module';
import { ProductModule } from './api/product/product.module';
import { ClothingModule } from './api/clothing/clothing.module';
import { CategoryModule } from './api/category/category.module';
import { TypeClothingModule } from './api/type-clothing/type-clothing.module';
import { UserAppModule } from './api/user-app/user-app.module';
import { RolesModule } from './api/role/roles.module';
import { UserRoleModule } from './api/user-role/user-role.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ErrorLogModule,
    ProductModule,
    ClothingModule,
    CategoryModule,
    TypeClothingModule,
    UserAppModule,
    RolesModule,
    UserRoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
