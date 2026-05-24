import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { StorageService } from '../../common/services/storage.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class HealthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
        private readonly storageService: StorageService,
    ) { }

    async getStatus(): Promise<{
        status: 'ok' | 'degraded';
        postgres: boolean;
        redis: boolean;
        garage: boolean;
        postgresError?: string;
        redisError?: string;
        garageError?: string;
        databaseUrlConfigured: boolean;
        redisUrlConfigured: boolean;
        garageConfigured: boolean;
        database?: { tableCount: number; tables: string[] };
        timestamp: string;
    }> {
        const [postgresCheck, redisCheck, garageCheck] = await Promise.all([
            this.checkPostgres(),
            this.checkRedis(),
            this.checkGarage(),
        ]);

        const postgres = postgresCheck.ok;
        const redis = redisCheck.ok;
        const garage = garageCheck.ok;
        const status = postgres && redis && garage ? 'ok' : 'degraded';

        return {
            status,
            postgres,
            redis,
            garage,
            postgresError: postgresCheck.error,
            redisError: redisCheck.error,
            garageError: garageCheck.error,
            databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
            redisUrlConfigured: Boolean(process.env.REDIS_URL),
            garageConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
            database: postgresCheck.ok ? postgresCheck.database : undefined,
            timestamp: new Date().toISOString(),
        };
    }

    private async checkPostgres(): Promise<{ ok: boolean; error?: string; database?: { tableCount: number; tables: string[] } }> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            const rows = await this.prisma.$queryRaw<{ tablename: string }[]>`
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename
            `;
            const tables = rows.map(r => r.tablename);
            return { ok: true, database: { tableCount: tables.length, tables } };
        } catch (error) {
            return {
                ok: false,
                error: this.sanitizeError(error),
            };
        }
    }

    private async checkRedis(): Promise<{ ok: boolean; error?: string }> {
        try {
            await this.redisService.ping();
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: this.sanitizeError(error),
            };
        }
    }

    private async checkGarage(): Promise<{ ok: boolean; error?: string }> {
        try {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
            });
            await cloudinary.api.ping();
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: this.sanitizeError(error),
            };
        }
    }

    private sanitizeError(error: unknown): string {
        if (error instanceof Error && error.message) {
            return error.message.replace(/(postgres(?:ql)?:\/\/)[^\s@]+@/gi, '$1***:***@');
        }

        return 'Unknown error';
    }
}
