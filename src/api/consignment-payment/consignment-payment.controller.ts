import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ConsignmentPaymentService,
  CreatePaymentDto,
} from './consignment-payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

@Controller('consignment/payments')
@UseGuards(JwtAuthGuard)
export class ConsignmentPaymentController {
  private s3: S3Client;
  private bucket: string;

  constructor(
    private readonly service: ConsignmentPaymentService,
    private readonly configService: ConfigService,
  ) {
    this.bucket =
      this.configService.get('DO_SPACES_BUCKET') || 'twosix-catalog-storage';
    this.s3 = new S3Client({
      endpoint:
        this.configService.get('DO_SPACES_ENDPOINT') ||
        'https://atl1.digitaloceanspaces.com',
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('DO_SPACES_KEY') || '',
        secretAccessKey: this.configService.get('DO_SPACES_SECRET') || '',
      },
    });
  }

  // ================ Endpoints del CLIENTE ================

  /** El aliado sube comprobante de pago + datos. */
  @Post('upload')
  @UseInterceptors(FileInterceptor('proof'))
  async createWithUpload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: any,
  ) {
    const customerId = req.user?.sub;
    let proofUrl: string | undefined;

    // Si hay archivo, subirlo a Spaces
    if (file) {
      const key = `consignment/payments/${Date.now()}-${file.originalname}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        }),
      );
      const endpoint =
        this.configService.get('DO_SPACES_CDN') ||
        `https://${this.bucket}.atl1.digitaloceanspaces.com`;
      proofUrl = `${endpoint}/${key}`;
    }

    return this.service.create({
      id_order: Number(body.id_order),
      id_customer: customerId,
      amount: parseFloat(body.amount),
      payment_method: body.payment_method,
      proof_image_url: proofUrl,
      reference_number: body.reference_number,
      notes: body.notes,
    });
  }

  /** El aliado ve sus pagos. */
  @Get('my-payments')
  getMyPayments(@Request() req: any) {
    return this.service.findByCustomer(req.user?.sub);
  }

  /** El aliado ve sus órdenes pendientes de pago. */
  @Get('my-unpaid')
  getMyUnpaidOrders(@Request() req: any) {
    return this.service.getUnpaidOrders(req.user?.sub);
  }

  // ================ Endpoints del CMS ================

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('id_customer') id_customer?: string,
  ) {
    return this.service.findAll({
      status,
      id_customer: id_customer ? Number(id_customer) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approved_by?: string },
  ) {
    return this.service.approve(id, body.approved_by || 'Operador CMS');
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string; rejected_by?: string },
  ) {
    return this.service.reject(
      id,
      body.reason,
      body.rejected_by || 'Operador CMS',
    );
  }
}
