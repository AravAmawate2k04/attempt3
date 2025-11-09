import { Worker } from 'bullmq';
import { ORDER_QUEUE_NAME, redisConnection } from '../queue/orderQueue';
import { MockDexRouter } from '../services/mockDexRouter';
import { getOrderById, updateOrderStatus, setOrderRoutingDecision, setOrderExecutionSuccess, setOrderExecutionFailed, } from '../repositories/orderRepository';
import { publishOrderStatus } from '../queue/orderEvents';
const router = new MockDexRouter();
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function processOrder(job) {
    const { orderId } = job.data;
    console.log(`Worker: starting processing order ${orderId}, jobId=${job.id}`);
    const order = await getOrderById(orderId);
    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }
    // initial "pending" (optional but nice)
    await publishOrderStatus({
        orderId,
        status: order.status, // should be "pending"
    });
    // 1) routing: get best DEX
    await updateOrderStatus(orderId, 'routing');
    await publishOrderStatus({ orderId, status: 'routing' });
    const { bestDex, bestQuote, raydiumQuote, meteoraQuote } = await router.getBestRoute(order.tokenIn, order.tokenOut, order.amountIn);
    console.log(`Worker: quotes for order ${orderId}: ` +
        `Raydium=${raydiumQuote.price.toFixed(4)} (fee ${raydiumQuote.feeBps}bps), ` +
        `Meteora=${meteoraQuote.price.toFixed(4)} (fee ${meteoraQuote.feeBps}bps); ` +
        `chosen=${bestDex} @ ${bestQuote.price.toFixed(4)}`);
    await setOrderRoutingDecision(orderId, bestDex);
    await publishOrderStatus({
        orderId,
        status: 'routing',
        chosenDex: bestDex,
    });
    // 2) building
    await updateOrderStatus(orderId, 'building');
    await publishOrderStatus({ orderId, status: 'building' });
    console.log(`Worker: building transaction for order ${orderId}`);
    await sleep(500); // simulate build time
    // 3) submitted
    await updateOrderStatus(orderId, 'submitted');
    await publishOrderStatus({ orderId, status: 'submitted' });
    console.log(`Worker: submitted transaction for order ${orderId}`);
    // 4) execution (confirmed or failed)
    try {
        const exec = await router.executeSwap(bestDex, order.tokenIn, order.tokenOut, order.amountIn, bestQuote.price);
        // Slippage protection: check if executed price deviates more than 1% from quoted price
        const slippage = Math.abs(exec.executedPrice - bestQuote.price) / bestQuote.price;
        const maxSlippage = 0.01; // 1%
        if (slippage > maxSlippage) {
            throw new Error(`Slippage too high: ${slippage.toFixed(4)} > ${maxSlippage}, expected ${bestQuote.price.toFixed(4)}, got ${exec.executedPrice.toFixed(4)}`);
        }
        await setOrderExecutionSuccess(orderId, exec.executedPrice, exec.txHash);
        await publishOrderStatus({
            orderId,
            status: 'confirmed',
            chosenDex: bestDex,
            txHash: exec.txHash,
        });
        console.log(`Worker: confirmed order ${orderId} on ${bestDex} at ` +
            `${exec.executedPrice.toFixed(4)}, txHash=${exec.txHash}`);
    }
    catch (err) {
        console.error(`Worker: execution failed for order ${orderId}`, err);
        await setOrderExecutionFailed(orderId, err.message || 'Unknown error');
        await publishOrderStatus({
            orderId,
            status: 'failed',
            error: err.message || 'Unknown error',
        });
        throw err; // for retries
    }
}
function startWorker() {
    const worker = new Worker(ORDER_QUEUE_NAME, async (job) => {
        console.log(`Worker: job ${job.id} attempt #${job.attemptsMade + 1} for order ${job.data.orderId}`);
        try {
            await processOrder(job);
        }
        catch (err) {
            console.error('Worker error processing job', job.id, err);
            throw err; // BullMQ will retry up to "attempts"
        }
    }, {
        connection: redisConnection,
        concurrency: 10,
    });
    worker.on('completed', (job) => {
        console.log(`Worker: job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        console.error(`Worker: job ${job?.id} failed`, err);
    });
    console.log('Order worker started');
}
startWorker();
//# sourceMappingURL=orderWorker.js.map