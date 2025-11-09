"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const orderQueue_1 = require("../queue/orderQueue");
const mockDexRouter_1 = require("../services/mockDexRouter");
const orderRepository_1 = require("../repositories/orderRepository");
const orderEvents_1 = require("../queue/orderEvents");
const router = new mockDexRouter_1.MockDexRouter();
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function processOrder(job) {
    const { orderId } = job.data;
    console.log(`Worker: starting processing order ${orderId}, jobId=${job.id}`);
    const order = await (0, orderRepository_1.getOrderById)(orderId);
    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }
    // initial "pending" (optional but nice)
    await (0, orderEvents_1.publishOrderStatus)({
        orderId,
        status: order.status, // should be "pending"
    });
    // 1) routing: get best DEX
    await (0, orderRepository_1.updateOrderStatus)(orderId, 'routing');
    await (0, orderEvents_1.publishOrderStatus)({ orderId, status: 'routing' });
    const { bestDex, bestQuote, raydiumQuote, meteoraQuote } = await router.getBestRoute(order.tokenIn, order.tokenOut, order.amountIn);
    console.log(`Worker: quotes for order ${orderId}: ` +
        `Raydium=${raydiumQuote.price.toFixed(4)} (fee ${raydiumQuote.feeBps}bps), ` +
        `Meteora=${meteoraQuote.price.toFixed(4)} (fee ${meteoraQuote.feeBps}bps); ` +
        `chosen=${bestDex} @ ${bestQuote.price.toFixed(4)}`);
    await (0, orderRepository_1.setOrderRoutingDecision)(orderId, bestDex);
    await (0, orderEvents_1.publishOrderStatus)({
        orderId,
        status: 'routing',
        chosenDex: bestDex,
    });
    // 2) building
    await (0, orderRepository_1.updateOrderStatus)(orderId, 'building');
    await (0, orderEvents_1.publishOrderStatus)({ orderId, status: 'building' });
    console.log(`Worker: building transaction for order ${orderId}`);
    await sleep(500); // simulate build time
    // 3) submitted
    await (0, orderRepository_1.updateOrderStatus)(orderId, 'submitted');
    await (0, orderEvents_1.publishOrderStatus)({ orderId, status: 'submitted' });
    console.log(`Worker: submitted transaction for order ${orderId}`);
    // 4) execution (confirmed or failed)
    try {
        const exec = await router.executeSwap(bestDex, order.tokenIn, order.tokenOut, order.amountIn, bestQuote.price);
        await (0, orderRepository_1.setOrderExecutionSuccess)(orderId, exec.executedPrice, exec.txHash);
        await (0, orderEvents_1.publishOrderStatus)({
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
        await (0, orderRepository_1.setOrderExecutionFailed)(orderId, err.message || 'Unknown error');
        await (0, orderEvents_1.publishOrderStatus)({
            orderId,
            status: 'failed',
            error: err.message || 'Unknown error',
        });
        throw err; // for retries
    }
}
function startWorker() {
    const worker = new bullmq_1.Worker(orderQueue_1.ORDER_QUEUE_NAME, async (job) => {
        try {
            await processOrder(job);
        }
        catch (err) {
            console.error('Worker error processing job', job.id, err);
            throw err; // let BullMQ handle retries
        }
    }, {
        connection: orderQueue_1.redisConnection,
        concurrency: 10, // supports up to 10 concurrent orders
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