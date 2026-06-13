import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly hasDatabaseUrl: boolean;
  private readonly logger: Logger;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const effectiveConnectionString =
      connectionString ??
      'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

    const options = {
      adapter: new PrismaPg(
        new Pool({
          connectionString: effectiveConnectionString,
          connectionTimeoutMillis: 10000, // Wait up to 10 seconds (10000ms)
        }),
      ),
    };

    super(options);
    this.hasDatabaseUrl = Boolean(connectionString);
    this.logger = new Logger(PrismaService.name);
  }

  async onModuleInit(): Promise<void> {
    if (!this.hasDatabaseUrl) {
      this.logger.warn(
        'DATABASE_URL is not set. Postgres checks will be reported as down.',
      );
      return;
    }

    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(
        `Postgres unavailable at startup. Health checks will report postgres=false. ${error instanceof Error ? error.message : ''}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
