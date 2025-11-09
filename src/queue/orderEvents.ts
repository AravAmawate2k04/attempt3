import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const redisOptions = redisUrl
  ? { url: redisUrl }
  : {
      host: redisHost,
      port: redisPort,
    };

export const ORDER_STATUS_CHANNEL = 'order-status';

export const redisPub = new IORedis(redisOptions);

export const redisSub = new IORedis(redisOptions);

export interface OrderStatusEvent {
  orderId: string;
  status: string;
  txHash?: string;
  chosenDex?: string;
  error?: string;
}

export async function publishOrderStatus(event: OrderStatusEvent) {
  await redisPub.publish(ORDER_STATUS_CHANNEL, JSON.stringify(event));
}