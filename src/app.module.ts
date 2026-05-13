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
import { ClothingColorModule } from './api/clothing-color/clothing-color.module';
import { SeasonModule } from './api/season/season.module';
import { OrderModule } from './api/order/order.module';
import { ProductionTypeModule } from './api/production-type/production-type.module';
import { DesignProviderModule } from './api/design-provider/design-provider.module';
import { LocationModule } from './api/location/location.module';
import { CustomerModule } from './api/customer/customer.module';
import { AddressModule } from './api/address/address.module';
import { ClothingSizeModule } from './api/clothing-size/clothing-size.module';
import { GenderModule } from './api/gender/gender.module';
import { ImageClothingModule } from './api/image-clothing/image-clothing.module';
import { ReportModule } from './api/report/report.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { LoggerModule } from 'nestjs-pino';
import { NewsletterModule } from './api/newsletter/newsletter.module';
import { PqrModule } from './api/pqr/pqr.module';

import { ScheduleModule } from '@nestjs/schedule';
import { SizeGuideModule } from './api/size-guide/size-guide.module';
import { ProviderDocumentModule } from './api/provider-document/provider-document.module';
import { DianModule } from './api/dian/dian.module';
import { AccountingModule } from './api/accounting/accounting.module';
import { PermissionModule } from './api/permission/permission.module';
import { InventoryModule } from './api/inventory/inventory.module';
import { TagModule } from './api/tag/tag.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CouponModule } from './api/coupon/coupon.module';
import { ConsignmentWarehouseModule } from './api/consignment-warehouse/consignment-warehouse.module';
import { ConsignmentPriceModule } from './api/consignment-price/consignment-price.module';
import { ConsignmentDispatchModule } from './api/consignment-dispatch/consignment-dispatch.module';
import { ConsignmentSelloutModule } from './api/consignment-sellout/consignment-sellout.module';
import { ConsignmentSellReportModule } from './api/consignment-sell-report/consignment-sell-report.module';
import { ConsignmentReturnModule } from './api/consignment-return/consignment-return.module';
import { ConsignmentCycleCountModule } from './api/consignment-cycle-count/consignment-cycle-count.module';
import { ConsignmentReportsModule } from './api/consignment-reports/consignment-reports.module';
import { ConsignmentPaymentModule } from './api/consignment-payment/consignment-payment.module';
import { ClsModule } from 'nestjs-cls';
import { SystemAuditModule } from './api/system-audit/system-audit.module';
import { ContactModule } from './api/contact/contact.module';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
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
    ClothingColorModule,
    SeasonModule,
    OrderModule,
    ProductionTypeModule,
    DesignProviderModule,
    LocationModule,
    CustomerModule,
    AddressModule,
    ClothingSizeModule,
    GenderModule,
    ImageClothingModule,
    ReportModule,
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
    NewsletterModule,
    PqrModule,
    SizeGuideModule,
    ProviderDocumentModule,
    DianModule,
    AccountingModule,
    PermissionModule,
    InventoryModule,
    TagModule,
    CouponModule,
    ConsignmentWarehouseModule,
    ConsignmentPriceModule,
    ConsignmentDispatchModule,
    ConsignmentSelloutModule,
    ConsignmentSellReportModule,
    ConsignmentReturnModule,
    ConsignmentCycleCountModule,
    ConsignmentReportsModule,
    ConsignmentPaymentModule,
    SystemAuditModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
