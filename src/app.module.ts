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
import { ProductionTypeModule } from './api/production-type/production-type.module';
import { DesignProviderModule } from './api/design-provider/design-provider.module';
import { LocationModule } from './api/location/location.module';
import { CustomerModule } from './api/customer/customer.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';

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
    ProductionTypeModule,
    DesignProviderModule,
    LocationModule,
    CustomerModule,
    AuthModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: true, // true para 465, false para otros puertos
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      defaults: {
        from: `"No Responder" <${process.env.EMAIL_SERVER_USER}>`, // Dirección de origen por defecto
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
