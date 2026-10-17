import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PG_ERROR } from '../constants/index.js';
import type { ErrorResponseDto } from '../dto/error-response.dto.js';

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { id?: string }>();
    const response = ctx.getResponse<Response>();

    const error = this.normalize(exception);

    if (error.status >= 500) {
      this.logger.error(
        { err: exception, path: request.originalUrl, method: request.method },
        error.message,
      );
    }

    const body: ErrorResponseDto = {
      statusCode: error.status,
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      ...(request.id && { requestId: String(request.id) }),
    };

    response.status(error.status).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const code = HttpStatus[status] ?? 'ERROR';

      if (typeof res === 'string') return { status, code, message: res };

      const {
        message,
        code: customCode,
        error: failedChecks,
      } = res as { message?: unknown; code?: unknown; error?: unknown };
      if (status === HttpStatus.SERVICE_UNAVAILABLE && isRecord(failedChecks)) {
        return {
          status,
          code,
          message: 'Health check failed',
          details: Object.keys(failedChecks).map((name) => `${name} is down`),
        };
      }
      if (Array.isArray(message)) {
        return {
          status,
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: message.map(String),
        };
      }
      return {
        status,
        code: typeof customCode === 'string' ? customCode : code,
        message: typeof message === 'string' ? message : exception.message,
      };
    }

    const pgCode = postgresErrorCode(exception);
    switch (pgCode) {
      case PG_ERROR.UNIQUE_VIOLATION:
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'Resource already exists',
        };
      case PG_ERROR.FOREIGN_KEY_VIOLATION:
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'Related resource conflict',
        };
      case PG_ERROR.NOT_NULL_VIOLATION:
      case PG_ERROR.INVALID_TEXT_REPRESENTATION:
        return { status: HttpStatus.BAD_REQUEST, code: 'BAD_REQUEST', message: 'Invalid input' };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function postgresErrorCode(error: unknown): string | undefined {
  for (let current = error, depth = 0; current && depth < 3; depth++) {
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = cause;
  }
  return undefined;
}
