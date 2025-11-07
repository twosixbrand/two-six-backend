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
import { ProviderModule } from './api/provider/provider.module';
import { MasterDesignModule } from './api/master-design/master-design.module';
import { CollectionModule } from './api/collection/collection.module';
import { YearProductionModule } from './api/year-production/year-production.module';
import { ColorModule } from './api/color/color.module';
import { SizeModule } from './api/size/size.module';
import { DesignClothingModule } from './api/design-clothing/design-clothing.module';
import { SeasonModule } from './api/season/season.module';
import { OrderModule } from './api/order/order.module';

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
    ProviderModule,
    MasterDesignModule,
    CollectionModule,
    YearProductionModule,
    ColorModule,
    SizeModule,
    DesignClothingModule,
    SeasonModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
