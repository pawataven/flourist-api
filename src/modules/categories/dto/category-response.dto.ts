import { ApiProperty } from '@nestjs/swagger';
import type { Category } from '../../../database/schema/index.js';

export class CategoryResponseDto implements Category {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'Bouquets' }) name: string;
  @ApiProperty({ example: 'bouquets' }) slug: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
