import {
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, catchError, tap, throwError } from 'rxjs';
import type { Request, Response } from 'express';

const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
} as const;

function colorize(color: keyof typeof colors, value: string): string {
    return `${colors[color]}${value}${colors.reset}`;
}

function statusColor(statusCode: number): keyof typeof colors {
    if (statusCode >= 500) return 'red';
    if (statusCode >= 400) return 'yellow';
    if (statusCode >= 300) return 'magenta';
    return 'green';
}

function nowIso(): string {
    return new Date().toISOString();
}

function safeStringify(value: unknown): string {
    try {
        const json = JSON.stringify(value, null, 2);
        return json ?? 'undefined';
    } catch {
        return '[unserializable]';
    }
}

function getRequestMeta(request: Request) {
    return {
        method: request.method,
        url: request.originalUrl || request.url,
        ip: request.ip,
        query: request.query ?? {},
        params: request.params ?? {},
        body: request.body ?? null,
    };
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const http = context.switchToHttp();
        const request = http.getRequest<Request>();
        const response = http.getResponse<Response>();

        const requestId = randomUUID();
        const startedAt = Date.now();
        const requestMeta = getRequestMeta(request);

        const line = colorize('dim', '─'.repeat(80));

        const requestLog = [
            line,
            `${colorize('dim', `[${nowIso()}]`)} ${colorize('bold', colorize('cyan', '[REQUEST]'))} ${colorize('dim', requestId)}`,
            `${colorize('cyan', `${requestMeta.method} ${requestMeta.url}`)} ${colorize('dim', `from ${requestMeta.ip ?? 'unknown-ip'}`)}`,
            `${colorize('bold', colorize('cyan', 'query'))}: ${safeStringify(requestMeta.query)}`,
            `${colorize('bold', colorize('cyan', 'params'))}: ${safeStringify(requestMeta.params)}`,
            `${colorize('bold', colorize('cyan', 'body'))}: ${safeStringify(requestMeta.body)}`,
        ].join('\n');

        console.log(`\n${requestLog}`);

        return next.handle().pipe(
            tap((responseBody) => {
                const status = response.statusCode ?? 200;
                const duration = Date.now() - startedAt;

                const responseLog = [
                    `${colorize('dim', `[${nowIso()}]`)} ${colorize('bold', colorize('green', '[RESPONSE]'))} ${colorize('dim', requestId)}`,
                    `status: ${colorize(statusColor(status), `${status}`)}  time: ${colorize('dim', `${duration}ms`)}`,
                    `${colorize('bold', colorize('green', 'response'))}: ${safeStringify(responseBody)}`,
                    line,
                ].join('\n');

                console.log(responseLog);
            }),
            catchError((error: unknown) => {
                const status =
                    error instanceof HttpException ? error.getStatus() : (response.statusCode ?? 500);
                const duration = Date.now() - startedAt;

                const errorBody =
                    error instanceof HttpException ? error.getResponse() : (error as Error)?.message;

                const errorLog = [
                    `${colorize('dim', `[${nowIso()}]`)} ${colorize('bold', colorize('red', '[RESPONSE-ERROR]'))} ${colorize('dim', requestId)}`,
                    `status: ${colorize(statusColor(status), `${status}`)}  time: ${colorize('dim', `${duration}ms`)}`,
                    `${colorize('bold', colorize('red', 'error'))}: ${safeStringify(errorBody ?? 'Unknown error')}`,
                ].join('\n');

                console.error(errorLog);

                return throwError(() => error);
            }),
        );
    }
}
