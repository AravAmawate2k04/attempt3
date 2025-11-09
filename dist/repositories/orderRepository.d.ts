import { Order, OrderStatus } from '../models/order.js';
interface CreateOrderInput {
    orderType: 'market';
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
}
export declare function createOrder(input: CreateOrderInput): Promise<Order>;
export declare function getOrderById(orderId: string): Promise<Order | null>;
export declare function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
export declare function setOrderRoutingDecision(orderId: string, chosenDex: 'raydium' | 'meteora'): Promise<void>;
export declare function setOrderExecutionSuccess(orderId: string, executedPrice: number, txHash: string): Promise<void>;
export declare function setOrderExecutionFailed(orderId: string, reason: string): Promise<void>;
export declare class OrderRepository {
    createOrder(order: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<Order>;
    updateOrderStatus(id: string, status: OrderStatus, chosenDex?: 'raydium' | 'meteora' | null, executedPrice?: number | null, txHash?: string | null, failedReason?: string | null): Promise<void>;
    getOrderById(id: string): Promise<Order | null>;
}
export {};
//# sourceMappingURL=orderRepository.d.ts.map