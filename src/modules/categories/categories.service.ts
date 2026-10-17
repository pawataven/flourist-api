import { Injectable, NotFoundException } from '@nestjs/common';
import { type Paginated, paginate, type PaginationQueryDto, slugify } from '../../common/index.js';
import type { Category } from '../../database/schema/index.js';
import { CategoriesRepository } from './categories.repository.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/index.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  async findAll(query: PaginationQueryDto): Promise<Paginated<Category>> {
    const [rows, total] = await this.repository.findMany({
      limit: query.limit,
      offset: query.offset,
      search: query.search,
    });
    return paginate(rows, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.repository.create({
      name: dto.name,
      slug: dto.slug ?? slugify(dto.name),
      description: dto.description,
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    if (Object.values(dto).every((value) => value === undefined)) return this.findOne(id);
    const category = await this.repository.update(id, dto);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundException('Category not found');
  }
}
