import { Test, TestingModule } from '@nestjs/testing';
import { TagService } from './tag.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('TagService', () => {
  let service: TagService;
  let prisma: PrismaService;

  const mockPrisma = {
    tag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tag with a generated slug', async () => {
      const data = { name: 'Test Tag' };
      const slug = 'test-tag';
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      mockPrisma.tag.create.mockResolvedValue({ id: 1, name: data.name, slug });

      const result = await service.create(data);

      expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({ where: { slug } });
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: { name: data.name, slug },
      });
      expect(result.slug).toBe(slug);
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 1, slug: 'test-tag' });

      await expect(service.create({ name: 'Test Tag' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all tags ordered by name', async () => {
      const mockTags = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
      mockPrisma.tag.findMany.mockResolvedValue(mockTags);

      const result = await service.findAll();

      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockTags);
    });
  });

  describe('findOne', () => {
    it('should return a tag by id', async () => {
      const tag = { id: 1, name: 'Tag' };
      mockPrisma.tag.findUnique.mockResolvedValue(tag);

      const result = await service.findOne(1);
      expect(result).toEqual(tag);
    });

    it('should throw NotFoundException if tag not found', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a tag and its slug', async () => {
      const tag = { id: 1, name: 'Old', slug: 'old' };
      mockPrisma.tag.findUnique.mockResolvedValueOnce(tag); // for findOne check
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null); // for slug collision check
      mockPrisma.tag.update.mockResolvedValue({ id: 1, name: 'New', slug: 'new' });

      const result = await service.update(1, { name: 'New' });

      expect(result.name).toBe('New');
      expect(result.slug).toBe('new');
    });

    it('should throw ConflictException if updated slug already exists for another tag', async () => {
        mockPrisma.tag.findUnique.mockResolvedValueOnce({ id: 1, name: 'Old' }); // findOne
        mockPrisma.tag.findUnique.mockResolvedValueOnce({ id: 2, name: 'Other', slug: 'new' }); // collision check
  
        await expect(service.update(1, { name: 'New' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a tag', async () => {
      mockPrisma.tag.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.tag.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
