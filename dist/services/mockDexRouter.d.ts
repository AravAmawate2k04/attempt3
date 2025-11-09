type DexName = 'raydium' | 'meteora';
export interface Quote {
    dex: DexName;
    price: number;
    feeBps: number;
}
export interface ExecutionResult {
    txHash: string;
    executedPrice: number;
}
export declare class MockDexRouter {
    getRaydiumQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<Quote>;
    getMeteoraQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<Quote>;
    getBestRoute(tokenIn: string, tokenOut: string, amountIn: number): Promise<{
        bestDex: DexName;
        bestQuote: Quote;
        raydiumQuote: Quote;
        meteoraQuote: Quote;
    }>;
    executeSwap(dex: DexName, tokenIn: string, tokenOut: string, amountIn: number, executedPrice: number): Promise<ExecutionResult>;
}
export {};
//# sourceMappingURL=mockDexRouter.d.ts.map