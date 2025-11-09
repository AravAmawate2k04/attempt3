import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redisConnection = new IORedis({
  host: redisHost,
  port: redisPort,
});

export const ORDER_QUEUE_NAME = 'order-execution';

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
  connection: redisConnection,
});