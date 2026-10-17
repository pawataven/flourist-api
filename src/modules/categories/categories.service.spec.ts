import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PaginationQueryDto } from '../../common/index.js';
import type { Category } from '../../database/schema/index.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';

const category: Category = {
  id: '6f1c2a8e-3b4d-4e5f-9a0b-1c2d3e4f5a6b',
  name: 'Bouquets',
  slug: 'bouquets',
  description: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  const repository = {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [CategoriesService, { provide: CategoriesRepository, useValue: repository }],
    }).compile();
    service = moduleRef.get(CategoriesService);
  });

  it('paginates results', async () => {
    repository.findMany.mockResolvedValue([[category], 41]);
    const query = Object.assign(new PaginationQueryDto(), { page: 2, limit: 20 });

    const result = await service.findAll(query);

    expect(repository.findMany).toHaveBeenCalledWith({ limit: 20, offset: 20, search: undefined });
    expect(result.meta).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
  });

  it('generates a slug from the name when none is given', async () => {
    repository.create.mockResolvedValue(category);

    await service.create({ name: 'Wedding Flowers' });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'wedding-flowers' }),
    );
  });

  it('throws NotFound for an unknown id', async () => {
    repository.findById.mockResolvedValue(undefined);
    await expect(service.findOne(category.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFound when deleting nothing', async () => {
    repository.delete.mockResolvedValue(false);
    await expect(service.remove(category.id)).rejects.toBeInstanceOf(NotFoundException);
  });
});
