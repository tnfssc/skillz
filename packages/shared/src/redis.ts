import { Redis } from "@upstash/redis/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";

export const createRedisClient = (url: string, token: string) => {
    return new Redis({
        url,
        token,
        automaticDeserialization: true,
        enableAutoPipelining: true,
    });
};

export { Ratelimit };
