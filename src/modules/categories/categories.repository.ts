import { Inject, Injectable } from '@nestjs/common';
import { count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '../../database/index.js';
import { type Category, categories, type NewCategory } from '../../database/schema/index.js';

export interface FindCategoriesOptions {
  limit: number;
  offset: number;
  search?: string;
}

@Injectable()
export class CategoriesRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findMany({ limit, offset, search }: FindCategoriesOptions): Promise<[Category[], number]> {
    const where = search ? searchFilter(search) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(categories)
        .where(where)
        .orderBy(desc(categories.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(categories).where(where),
    ]);
    return [rows, total];
  }

  async findById(id: string): Promise<Category | undefined> {
    const [row] = await this.db.select().from(categories).where(eq(categories.id, id));
    return row;
  }

  async create(data: NewCategory): Promise<Category> {
    const [row] = await this.db.insert(categories).values(data).returning();
    return row;
  }

  async update(id: string, data: Partial<NewCategory>): Promise<Category | undefined> {
    const [row] = await this.db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return row;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    return rows.length > 0;
  }
}

function searchFilter(search: string): SQL | undefined {
  const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  return or(ilike(categories.name, pattern), ilike(categories.slug, pattern));
}
