export type OrderStatus = 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';
export interface Order {
    id: string;
    orderType: 'market';
    tokenIn: string;
    tokenOut: string;
    amountIn: number;
    status: OrderStatus;
    chosenDex: 'raydium' | 'meteora' | null;
    executedPrice: number | null;
    txHash: string | null;
    failedReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=order.d.ts.map