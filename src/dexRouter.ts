import { DexQuote, ExecutionResult, Order } from './types';

export class MockDexRouter {
  private basePrices: Map<string, number> = new Map([
    ['SOL-USDC', 150], // Example prices
    ['USDC-SOL', 1/150],
  ]);

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getBasePrice(tokenIn: string, tokenOut: string): number {
    const key = `${tokenIn}-${tokenOut}`;
    return this.basePrices.get(key) || 1; // Default to 1 if not found
  }

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await this.sleep(200); // Simulate network delay
    const basePrice = this.getBasePrice(tokenIn, tokenOut);
    const price = basePrice * (0.98 + Math.random() * 0.04); // 2-5% variance
    return { dex: 'raydium', price, fee: 0.003 };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await this.sleep(200);
    const basePrice = this.getBasePrice(tokenIn, tokenOut);
    const price = basePrice * (0.97 + Math.random() * 0.05);
    return { dex: 'meteora', price, fee: 0.002 };
  }

  async getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<{ dex: 'raydium' | 'meteora', quote: DexQuote }> {
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amount),
      this.getMeteoraQuote(tokenIn, tokenOut, amount)
    ]);

    // Select best price (higher for selling, lower for buying? Wait, price is tokenOut per tokenIn
    // Assuming we want to maximize output for given input, so higher price if selling tokenIn for tokenOut
    // For simplicity, choose the one with higher price
    if (raydiumQuote.price > meteoraQuote.price) {
      return { dex: 'raydium', quote: raydiumQuote };
    } else {
      return { dex: 'meteora', quote: meteoraQuote };
    }
  }

  async executeSwap(dex: 'raydium' | 'meteora', order: Order): Promise<ExecutionResult> {
    await this.sleep(2000 + Math.random() * 1000); // 2-3 seconds
    const txHash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const executedPrice = this.getBasePrice(order.tokenIn, order.tokenOut) * (0.99 + Math.random() * 0.02); // Slight variation
    return { txHash, executedPrice };
  }
}