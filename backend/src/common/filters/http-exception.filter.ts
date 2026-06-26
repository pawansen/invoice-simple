import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standardised error response shape returned for every unhandled exception.
 * Matches the contract defined in the specification, e.g.:
 *   { "statusCode": 404, "message": "Invoice not found", "error": "Not Found" }
 * and for validation errors:
 *   { "statusCode": 400, "message": ["dueDate must be on or after invoiceDate"],
 *     "error": "Bad Request" }
 */
interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * Global exception filter. Converts any thrown error into the consistent
 * response shape above. Known Nest `HttpException`s preserve their status,
 * message and error label; anything else is reported as a 500 with its details
 * logged (but never leaked to the client).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name.replace(/Exception$/, '');
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        // ValidationPipe and Nest exceptions place the detail under `message`.
        message = (body.message as string | string[]) ?? message;
        error = (body.error as string) ?? error;
      }
    } else if (exception instanceof Error) {
      // Unexpected error: log full detail server-side, return a generic message.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    const body: ErrorResponseBody = {
      statusCode: status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
