import { Order, OrderStatus } from './types';
import { OrderRepository } from './repositories/orderRepository';
export declare class OrderQueue {
    private queue;
    private router;
    private statusCallbacks;
    private repository;
    constructor(repository: OrderRepository);
    addOrder(order: Order): Promise<void>;
    registerStatusCallback(orderId: string, callback: (status: OrderStatus) => void): void;
    private updateStatus;
    private processOrder;
    close(): Promise<void>;
}
//# sourceMappingURL=queue.d.ts.map