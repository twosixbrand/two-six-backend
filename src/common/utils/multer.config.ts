import { BadRequestException } from '@nestjs/common';

export const multerImageConfig = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|webp|avif|pdf)$/)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Tipo de archivo no soportado: ${file.mimetype}. Use JPG, PNG, WEBP o PDF.`,
        ),
        false,
      );
    }
  },
};

export const multerDocumentConfig = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB para documentos
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    if (
      file.mimetype.match(
        /\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/,
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Tipo de archivo no soportado: ${file.mimetype}. Use PDF, DOCX o XLSX.`,
        ),
        false,
      );
    }
  },
};
