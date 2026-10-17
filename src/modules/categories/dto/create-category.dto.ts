import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bouquets', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'bouquets',
    description: 'Generated from name when omitted',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(/^[\p{L}\p{M}\p{N}]+(?:-[\p{L}\p{M}\p{N}]+)*$/u, {
    message: 'slug must be lowercase words joined by hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Hand-tied bouquets for every occasion' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
