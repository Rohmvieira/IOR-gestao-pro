/**
 * Redis client — cache distribuído + rate limiting multi-pod
 * Compatível com Redis standalone e Redis Cluster (Kubernetes)
 *
 * SETUP .env:
 *   REDIS_URL=redis://localhost:6379
 *   ou em cluster: REDIS_URL=redis://redis-service:6379
 */
import { createClient, type RedisClientType } from "redis";
import { logger } from "./logger";

let client: RedisClientType | null = null;
let connected = false;

export async function getRedis(): Promise<RedisClientType | null> {
  if (!process.env.REDIS_URL) {
    // Redis opcional — fallback para rate limiting em memória
    return null;
  }
  if (client && connected) return client;

  client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
  client.on("error", (err) => logger.error({ err }, "Redis: erro de conexão"));
  client.on("connect", () => { connected = true; logger.info("Redis: conectado"); });
  client.on("end", () => { connected = false; });

  await client.connect().catch((err) => {
    logger.error({ err }, "Redis: falha ao conectar — usando fallback em memória");
    client = null;
  });
  return client;
}

/** Cache com TTL — getOrSet pattern */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const redis = await getRedis();
  if (redis) {
    const cached = await redis.get(key).catch(() => null);
    if (cached) return JSON.parse(cached) as T;
  }
  const data = await fetchFn();
  if (redis) {
    await redis.setEx(key, ttlSeconds, JSON.stringify(data)).catch(() => {});
  }
  return data;
}

/** Invalida chaves de cache por prefixo */
export async function cacheInvalidate(prefix: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  const keys = await redis.keys(`${prefix}*`).catch(() => [] as string[]);
  if (keys.length > 0) await redis.del(keys).catch(() => {});
}

/** Rate limiting distribuído com Redis — sliding window */
export async function redisRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = await getRedis();
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!redis) {
    // Sem Redis: permite (fallback — in-memory rate limit já age antes)
    return { allowed: true, remaining: max, resetAt: now + windowMs };
  }

  const redisKey = `rl:${key}`;
  const multi = redis.multi();
  multi.zRemRangeByScore(redisKey, 0, windowStart);          // remove requests antigos
  multi.zCard(redisKey);                                      // conta requests na janela
  multi.zAdd(redisKey, { score: now, value: `${now}` });     // adiciona request atual
  multi.expire(redisKey, Math.ceil(windowMs / 1000));        // TTL automático

  const results = await multi.exec().catch(() => null);
  const count = results ? (results[1] as number) : 0;
  const allowed = count < max;
  return { allowed, remaining: Math.max(0, max - count - 1), resetAt: now + windowMs };
}
