import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto.js';

export function ApiErrorResponses(...statuses: number[]) {
  return applyDecorators(
    ...statuses.map((status) => ApiResponse({ status, type: ErrorResponseDto })),
  );
}
