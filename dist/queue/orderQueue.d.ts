import { Queue } from 'bullmq';
import IORedis from 'ioredis';
export declare const redisConnection: IORedis;
export declare const ORDER_QUEUE_NAME = "order-execution";
export declare const orderQueue: Queue<any, any, string>;
//# sourceMappingURL=orderQueue.d.ts.map