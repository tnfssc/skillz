import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { apiKey } from 'better-auth/plugins';
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@skillz/db';
import { createRedisClient } from '@skillz/shared';

const BETTER_AUTH_KV_PREFIX = 'ba:';
const MAX_PX = 2147483647; // Max 32-bit signed integer

export const createAuth = (env: {
    DB: D1Database;
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_URL?: string;
}) => {
    const db = drizzle(env.DB);
    const kv = createRedisClient(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);

    return betterAuth({
        appName: 'Skillz',
        baseURL: env.BETTER_AUTH_URL || 'http://localhost:8787',
        trustedOrigins: ['http://localhost:5173', 'http://localhost:8787', 'https://skillz.lat'],
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
        }),
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false, // Dev mode - skip verification
        },
        plugins: [
            apiKey({
                defaultPrefix: 'sk_',
                enableMetadata: true,
                keyExpiration: {
                    defaultExpiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
                    maxExpiresIn: 365 * 24 * 60 * 60, // 1 year in seconds
                    minExpiresIn: 24 * 60 * 60, // 1 day in seconds
                },
                permissions: {
                    defaultPermissions: {
                        api: ['read', 'write'],
                    },
                },
                // 200 requests per minute per API key
                rateLimit: {
                    enabled: true,
                    maxRequests: 200,
                    timeWindow: 1000 * 60,
                },
            }),
        ],
        rateLimit: {
            // 60 requests per minute per IP
            enabled: true,
            max: 60,
            storage: 'secondary-storage',
            window: 60,
        },
        secondaryStorage: {
            get: async (key) => {
                return await kv.get(BETTER_AUTH_KV_PREFIX + key);
            },
            set: async (key, value, ttl) => {
                let pxMs: number | undefined;
                if (typeof ttl === 'number' && Number.isFinite(ttl) && ttl > 0) {
                    // TTL is in seconds, convert to milliseconds
                    const ttlMs = ttl > 1000 * 1000 ? ttl : ttl * 1000;
                    pxMs = Math.floor(ttlMs);
                    if (pxMs > MAX_PX) {
                        pxMs = MAX_PX;
                    }
                }

                // Set with px option if we have a TTL
                return pxMs
                    ? await kv.set(BETTER_AUTH_KV_PREFIX + key, value, { px: pxMs })
                    : await kv.set(BETTER_AUTH_KV_PREFIX + key, value);
            },
            delete: async (key) => {
                await kv.del(BETTER_AUTH_KV_PREFIX + key);
            },
        },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
        },
    });
};
