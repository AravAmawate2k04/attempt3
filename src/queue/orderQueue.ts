import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const redisOptions = redisUrl
  ? { url: redisUrl } // Render: use full URL
  : {
      host: redisHost,
      port: redisPort,
    };

export const redisConnection = new IORedis(redisOptions);

export const ORDER_QUEUE_NAME = 'order-execution';

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
  connection: redisConnection,
});