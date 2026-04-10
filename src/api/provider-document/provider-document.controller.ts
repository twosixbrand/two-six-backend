import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    Body,
    ParseIntPipe, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerDocumentConfig } from '../../common/utils/multer.config';
import { ProviderDocumentService } from './provider-document.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('provider-document')
export class ProviderDocumentController {
    constructor(private readonly service: ProviderDocumentService) { }

    @Post('upload/:providerId')
    @UseInterceptors(FileInterceptor('file', { ...multerDocumentConfig }))
    async upload(
        @Param('providerId') providerId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('documentType') documentType: string,
    ) {
        return this.service.uploadDocument(file, providerId, documentType);
    }

    @Get(':providerId')
    async findAll(@Param('providerId') providerId: string) {
        return this.service.findAllByProvider(providerId);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.removeDocument(id);
    }
}
