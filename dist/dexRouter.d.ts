import { DexQuote, ExecutionResult, Order } from './types';
export declare class MockDexRouter {
    private basePrices;
    private sleep;
    private getBasePrice;
    getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote>;
    getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote>;
    getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<{
        dex: 'raydium' | 'meteora';
        quote: DexQuote;
    }>;
    executeSwap(dex: 'raydium' | 'meteora', order: Order): Promise<ExecutionResult>;
}
//# sourceMappingURL=dexRouter.d.ts.map