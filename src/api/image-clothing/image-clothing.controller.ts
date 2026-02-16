import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFiles, ParseIntPipe, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageClothingService } from './image-clothing.service';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('image-clothing')
export class ImageClothingController {
    constructor(private readonly imageClothingService: ImageClothingService) { }

    @Post('upload/:id_clothing_color')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    uploadImages(
        @UploadedFiles() files: Express.Multer.File[],
        @Param('id_clothing_color', ParseIntPipe) id: number
    ) {
        return this.imageClothingService.uploadImages(files, id);
    }

    @Get(':id_clothing_color')
    findAll(@Param('id_clothing_color', ParseIntPipe) id: number) {
        return this.imageClothingService.findAll(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.imageClothingService.remove(id);
    }

    @Post('reorder/:id_clothing_color')
    reorder(
        @Param('id_clothing_color', ParseIntPipe) id: number,
        @Body() body: { imageIds: number[] }
    ) {
        return this.imageClothingService.reorder(id, body.imageIds);
    }
}
