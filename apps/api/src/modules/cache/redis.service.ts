import { Global, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

@Global()
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType | null = null;
    private readonly redisUrl = process.env.REDIS_URL;
    private readonly logger = new Logger(RedisService.name);
    private hasLoggedConnectionError = false;

    async onModuleInit(): Promise<void> {
        if (!this.redisUrl) {
            this.logger.warn('REDIS_URL is not set. Redis checks will be reported as down.');
            return;
        }

        try {
            await this.ensureConnected();
        } catch (error) {
            this.logger.warn(
                `Redis unavailable at startup. Health checks will report redis=false. ${error instanceof Error ? error.message : ''}`,
            );
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.client) {
            try {
                await this.client.quit();
            } catch {
                // Ignore shutdown errors when redis is unavailable.
            }
            this.client = null;
        }
    }

    getClient(): RedisClientType {
        if (!this.client) {
            throw new Error('Redis client is not initialized');
        }

        return this.client;
    }

    async ping(): Promise<string> {
        if (!this.redisUrl) {
            throw new Error('Redis is unavailable');
        }

        await this.ensureConnected();
        return this.getClient().ping();
    }

    private async ensureConnected(): Promise<void> {
        if (!this.redisUrl) {
            throw new Error('REDIS_URL is not set');
        }

        if (!this.client) {
            this.client = createClient({
                url: this.redisUrl,
                socket: {
                    // Avoid continuous reconnect loops when redis is unavailable.
                    reconnectStrategy: () => false,
                },
            });

            this.client.on('error', (error) => {
                if (!this.hasLoggedConnectionError) {
                    this.hasLoggedConnectionError = true;
                    this.logger.warn(
                        `Redis unavailable. Health checks will report redis=false. ${error instanceof Error ? error.message : ''}`,
                    );
                }
            });
        }

        if (!this.client.isOpen) {
            await this.client.connect();
        }

        this.hasLoggedConnectionError = false;
    }
}
