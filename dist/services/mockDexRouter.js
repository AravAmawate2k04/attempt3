function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Helpers to simulate random but reasonable numbers
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}
export class MockDexRouter {
    async getRaydiumQuote(tokenIn, tokenOut, amountIn) {
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
    async getMeteoraQuote(tokenIn, tokenOut, amountIn) {
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
    async getBestRoute(tokenIn, tokenOut, amountIn) {
        const [raydiumQuote, meteoraQuote] = await Promise.all([
            this.getRaydiumQuote(tokenIn, tokenOut, amountIn),
            this.getMeteoraQuote(tokenIn, tokenOut, amountIn),
        ]);
        const raydiumOutput = amountIn * raydiumQuote.price * (1 - raydiumQuote.feeBps / 10000);
        const meteoraOutput = amountIn * meteoraQuote.price * (1 - meteoraQuote.feeBps / 10000);
        const best = meteoraOutput > raydiumOutput ? meteoraQuote : raydiumQuote;
        return {
            bestDex: best.dex,
            bestQuote: best,
            raydiumQuote,
            meteoraQuote,
        };
    }
    async executeSwap(dex, tokenIn, tokenOut, amountIn, executedPrice) {
        // simulate building + sending tx (2-3 seconds)
        await sleep(2000 + Math.random() * 1000);
        const randomTxHash = `0x${Math.random().toString(16).slice(2).padEnd(64, '0')}`;
        return {
            txHash: randomTxHash,
            executedPrice,
        };
    }
}
//# sourceMappingURL=mockDexRouter.js.map