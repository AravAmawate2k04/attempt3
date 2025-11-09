export interface Order {
    id: string;
    type: 'market';
    tokenIn: string;
    tokenOut: string;
    amount: number;
    slippage?: number;
    userId?: string;
}
export interface OrderStatus {
    orderId: string;
    status: 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';
    message?: string;
    txHash?: string;
    executedPrice?: number;
    timestamp: Date;
}
export interface DexQuote {
    dex: 'raydium' | 'meteora';
    price: number;
    fee: number;
}
export interface ExecutionResult {
    txHash: string;
    executedPrice: number;
}
//# sourceMappingURL=types.d.ts.map