import { MockDexRouter, Quote } from '../src/services/mockDexRouter';

class TestRouter extends MockDexRouter {
  // Override to return deterministic values instead of random

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<Quote> {
    return {
      dex: 'raydium',
      price: 20,   // base price
      feeBps: 30,  // 0.30%
    };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amountIn: number): Promise<Quote> {
    return {
      dex: 'meteora',
      price: 19,   // slightly worse price
      feeBps: 25,  // 0.25%
    };
  }
}

describe('MockDexRouter routing', () => {
  it('chooses Raydium when its effective output is better', async () => {
    const router = new TestRouter();

    const { bestDex, bestQuote } = await router.getBestRoute('SOL', 'USDC', 1);

    expect(bestDex).toBe('raydium');
    expect(bestQuote.dex).toBe('raydium');
  });

  it('chooses Meteora when its effective output is better', async () => {
    class ReverseRouter extends MockDexRouter {
      async getRaydiumQuote(): Promise<Quote> {
        return { dex: 'raydium', price: 19, feeBps: 30 };
      }
      async getMeteoraQuote(): Promise<Quote> {
        return { dex: 'meteora', price: 20, feeBps: 25 };
      }
    }

    const router = new ReverseRouter();
    const { bestDex, bestQuote } = await router.getBestRoute('SOL', 'USDC', 1);

    expect(bestDex).toBe('meteora');
    expect(bestQuote.dex).toBe('meteora');
  });
});