import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    Body,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProviderDocumentService } from './provider-document.service';

@Controller('provider-document')
export class ProviderDocumentController {
    constructor(private readonly service: ProviderDocumentService) { }

    @Post('upload/:providerId')
    @UseInterceptors(FileInterceptor('file'))
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
