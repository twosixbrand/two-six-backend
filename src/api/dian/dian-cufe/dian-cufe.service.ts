import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface CufeParamsDto {
  NumFac: string;
  FecFac: string;
  HorFac: string;
  ValFac: string;
  CodImp1: string;
  ValImp1: string;
  CodImp2: string;
  ValImp2: string;
  CodImp3: string;
  ValImp3: string;
  ValTot: string;
  NitOfe: string;
  NumAdq: string;
  ClTec: string;
  TipoAmb: string;
}

@Injectable()
export class DianCufeService {
  /**
   * Genera el CUFE (Código Único de Facturación Electrónica) según Anexo Técnico DIAN
   */
  generateCufe(params: CufeParamsDto): string {
    const {
      NumFac, FecFac, HorFac, ValFac, CodImp1, ValImp1,
      CodImp2, ValImp2, CodImp3, ValImp3, ValTot,
      NitOfe, NumAdq, ClTec, TipoAmb,
    } = params;

    const cufeString = `${NumFac}${FecFac}${HorFac}${ValFac}${CodImp1}${ValImp1}${CodImp2}${ValImp2}${CodImp3}${ValImp3}${ValTot}${NitOfe}${NumAdq}${ClTec}${TipoAmb}`;
    
    // El CUFE siempre es un SHA-384 convertido a HEX
    return crypto.createHash('sha384').update(cufeString).digest('hex');
  }
}
