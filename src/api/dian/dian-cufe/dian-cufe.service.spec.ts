import { Test, TestingModule } from '@nestjs/testing';
import { DianCufeService } from './dian-cufe.service';
import * as crypto from 'crypto';

describe('DianCufeService', () => {
  let service: DianCufeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianCufeService],
    }).compile();

    service = module.get<DianCufeService>(DianCufeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCufe', () => {
    it('should generate a valid SHA-384 hex hash for a given invoice (CUFE)', () => {
      const params = {
        NumFac: 'FE123',
        FecFac: '2026-04-24',
        HorFac: '15:30:00-05:00',
        ValFac: '100000.00',
        CodImp1: '01',
        ValImp1: '19000.00',
        CodImp2: '04',
        ValImp2: '0.00',
        CodImp3: '03',
        ValImp3: '0.00',
        ValTot: '119000.00',
        NitOfe: '900123456',
        NumAdq: '1234567890',
        ClTec: 'technicakey12345',
        TipoAmb: '2',
      };

      const expectedString =
        'FE1232026-04-2415:30:00-05:00100000.000119000.00040.00030.00119000.009001234561234567890technicakey123452';
      const expectedHash = crypto
        .createHash('sha384')
        .update(expectedString)
        .digest('hex');

      const cufe = service.generateCufe(params);

      expect(cufe).toBeDefined();
      expect(cufe).toEqual(expectedHash);
      expect(cufe.length).toBe(96); // SHA-384 hex is 96 chars
    });
  });

  describe('generateCude', () => {
    it('should generate a valid SHA-384 hex hash for a given credit note (CUDE)', () => {
      const params = {
        NumNota: 'NC123',
        FecNota: '2026-04-24',
        HorNota: '15:30:00-05:00',
        ValNota: '100000.00',
        CodImp1: '01',
        ValImp1: '19000.00',
        CodImp2: '04',
        ValImp2: '0.00',
        CodImp3: '03',
        ValImp3: '0.00',
        ValTot: '119000.00',
        NitOfe: '900123456',
        NumAdq: '1234567890',
        PinSoftware: 'softwarepin12345',
        TipoAmb: '2',
      };

      const expectedString =
        'NC1232026-04-2415:30:00-05:00100000.000119000.00040.00030.00119000.009001234561234567890softwarepin123452';
      const expectedHash = crypto
        .createHash('sha384')
        .update(expectedString)
        .digest('hex');

      const cude = service.generateCude(params);

      expect(cude).toBeDefined();
      expect(cude).toEqual(expectedHash);
      expect(cude.length).toBe(96); // SHA-384 hex is 96 chars
    });
  });
});
