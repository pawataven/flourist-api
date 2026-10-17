import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 }) statusCode: number;
  @ApiProperty({ example: 'NOT_FOUND' }) code: string;
  @ApiProperty({ example: 'Category not found' }) message: string;
  @ApiPropertyOptional({ type: [String], example: ['name must be a string'] }) details?: string[];
  @ApiProperty({ example: '/api/v1/categories/123' }) path: string;
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' }) timestamp: string;
  @ApiPropertyOptional({ example: '8f14e45f-ceea-4f6a-9b1b-2c6f4d1e2a3b' }) requestId?: string;
}
