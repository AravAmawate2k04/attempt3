import IORedis from 'ioredis';
export declare const ORDER_STATUS_CHANNEL = "order-status";
export declare const redisPub: IORedis;
export declare const redisSub: IORedis;
export interface OrderStatusEvent {
    orderId: string;
    status: string;
    txHash?: string;
    chosenDex?: string;
    error?: string;
}
export declare function publishOrderStatus(event: OrderStatusEvent): Promise<void>;
//# sourceMappingURL=orderEvents.d.ts.map