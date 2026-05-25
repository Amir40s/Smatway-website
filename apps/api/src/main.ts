import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';

const appEnvPath = resolve(__dirname, '..', '.env');
if (existsSync(appEnvPath)) {
  loadEnv({ path: appEnvPath });
}

const logger = new Logger('Bootstrap');
const maxPortAttempts = 20;

function resolveStartPort(defaultPort: number): number {
  const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
  if (Number.isInteger(parsedPort) && parsedPort > 0) {
    return parsedPort;
  }

  return defaultPort;
}

async function bootstrap() {
  // Lazy-load AppModule after dotenv has been applied.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppModule } = require('./app.module') as typeof import('./app.module');
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  const allowedOrigins = [
    'https://smatway.com',
    'https://admin.smatway.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3009',
  ];

  if (process.env.ALLOWED_REDIRECT_URLS) {
    const urls = process.env.ALLOWED_REDIRECT_URLS.split(',').map((u) => u.trim());
    urls.forEach((url) => {
      // Clean up any weird trailing characters from cut-and-paste typos (like > or spaces)
      const cleanUrl = url.replace(/>+$/, '').trim();
      if (cleanUrl && !allowedOrigins.includes(cleanUrl)) {
        allowedOrigins.push(cleanUrl);
      }
    });
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
  });

  const startPort = resolveStartPort(3002);
  let selectedPort = startPort;

  for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
    // Try binding directly; this avoids race conditions between probe and listen.
    // eslint-disable-next-line no-await-in-loop
    try {
      await app.listen(selectedPort, '0.0.0.0');

      if (selectedPort !== startPort) {
        logger.warn(`Port ${startPort} is busy. Falling back to port ${selectedPort}.`);
      }

      logger.log(`API listening on port ${selectedPort}`);
      return;
    } catch (error) {
      const isAddressInUse =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'EADDRINUSE';

      if (!isAddressInUse) {
        throw error;
      }

      selectedPort += 1;
    }
  }

  throw new Error(`No free port found in range ${startPort}-${startPort + maxPortAttempts - 1}`);
}
bootstrap();
