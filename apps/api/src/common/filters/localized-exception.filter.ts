import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { resolveApiLocale, translateApiText, translateApiValue } from '../i18n';

@Catch(HttpException)
export class LocalizedExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const locale = resolveApiLocale(request.headers['accept-language']);
    const status = exception.getStatus();
    const rawPayload = exception.getResponse();

    const payload: Record<string, unknown> =
      typeof rawPayload === 'string'
        ? {
            statusCode: status,
            message: translateApiText(rawPayload, locale),
            error: translateApiText(exception.name, locale),
          }
        : {
            ...(rawPayload as Record<string, unknown>),
          };

    payload.statusCode ??= status;
    payload.message = translateApiValue(payload.message, locale);
    payload.error = translateApiValue(payload.error, locale);

    response.status(status).json(payload);
  }
}
