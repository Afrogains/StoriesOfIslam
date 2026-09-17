import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new HttpError(404, 'not_found', 'The requested resource was not found'));
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: error.flatten(),
        requestId: request.id,
      },
    });
    return;
  }

  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : 'internal_error';
  const message =
    error instanceof HttpError ? error.message : 'An unexpected server error occurred';

  if (status >= 500) {
    logger.error({ err: error, requestId: request.id }, 'Request failed');
  }

  response.status(status).json({
    error: {
      code,
      message,
      details: error instanceof HttpError ? error.details : undefined,
      requestId: request.id,
    },
  });
};

export function asyncHandler(
  handler: (...args: Parameters<RequestHandler>) => Promise<unknown>,
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}
