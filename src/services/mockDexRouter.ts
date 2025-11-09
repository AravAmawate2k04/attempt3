type DexName = 'raydium' | 'meteora';

export interface Quote {
  dex: DexName;
  price: number; // e.g. how many tokenOut per 1 tokenIn
  feeBps: number; // fee in basis points, e.g. 30 = 0.30%
}

export interface ExecutionResult {
  txHash: string;
  executedPrice: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helpers to simulate random but reasonable numbers
function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export class MockDexRouter {
  async getRaydiumQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<Quote> {
    // simulate network delay
    await sleep(200 + Math.random() * 200);

    const basePrice = 20; // arbitrary base price example (e.g. 1 SOL = 20 USDC)
    const variance = randomBetween(-0.05, 0.05); // ±5%
    const price = basePrice * (1 + variance); 

    return {
      dex: 'raydium',
      price,
      feeBps: 30, // 0.30% fee
    };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<Quote> {
    await sleep(200 + Math.random() * 200);

    const basePrice = 20;
    const variance = randomBetween(-0.05, 0.05);
    const price = basePrice * (1 + variance);

    return {
      dex: 'meteora',
      price,
      feeBps: 25, // 0.25% fee, maybe slightly better fee
    };
  }

  // Compare two quotes and pick the one with better "effective" output after fee
  async getBestRoute(tokenIn: string, tokenOut: string, amountIn: number) {
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amountIn),
      this.getMeteoraQuote(tokenIn, tokenOut, amountIn),
    ]);

    const raydiumOutput =
      amountIn * raydiumQuote.price * (1 - raydiumQuote.feeBps / 10_000);
    const meteoraOutput =
      amountIn * meteoraQuote.price * (1 - meteoraQuote.feeBps / 10_000);

    const best =
      meteoraOutput > raydiumOutput ? meteoraQuote : raydiumQuote;

    return {
      bestDex: best.dex,
      bestQuote: best,
      raydiumQuote,
      meteoraQuote,
    };
  }

  async executeSwap(
    dex: DexName,
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    executedPrice: number
  ): Promise<ExecutionResult> {
    // simulate building + sending tx (2-3 seconds)
    await sleep(2000 + Math.random() * 1000);

    const randomTxHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;

    return {
      txHash: randomTxHash,
      executedPrice,
    };
  }
}