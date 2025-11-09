import { Worker, Queue } from 'bullmq';
import { MockDexRouter } from './dexRouter';
export class OrderQueue {
    constructor(repository) {
        this.statusCallbacks = new Map();
        this.repository = repository;
        try {
            this.queue = new Queue('orders', {
                connection: {
                    host: 'localhost',
                    port: 6379,
                },
            });
            this.router = new MockDexRouter();
            // Set up worker
            const worker = new Worker('orders', async (job) => {
                const order = job.data;
                await this.processOrder(order);
            }, {
                connection: {
                    host: 'localhost',
                    port: 6379,
                },
            });
            worker.on('completed', (job) => {
                console.log(`Order ${job.data.id} completed`);
            });
            worker.on('failed', (job, err) => {
                if (job) {
                    console.log(`Order ${job.data.id} failed: ${err.message}`);
                    this.updateStatus(job.data.id, 'failed', err.message);
                }
            });
        }
        catch (error) {
            console.error('Failed to initialize queue:', error);
            // Don't throw, just log
        }
    }
    async addOrder(order) {
        if (!this.queue) {
            throw new Error('Queue not initialized');
        }
        await this.queue.add('execute', order, { removeOnComplete: 10, removeOnFail: 5 });
        this.updateStatus(order.id, 'pending');
    }
    registerStatusCallback(orderId, callback) {
        this.statusCallbacks.set(orderId, callback);
    }
    updateStatus(orderId, status, message, txHash, executedPrice) {
        // Update in DB
        this.repository.updateOrderStatus(orderId, status, undefined, executedPrice, txHash, message).catch(err => console.error('Failed to update status in DB:', err));
        const callback = this.statusCallbacks.get(orderId);
        if (callback) {
            const orderStatus = {
                orderId,
                status,
                message,
                txHash,
                executedPrice,
                timestamp: new Date(),
            };
            callback(orderStatus);
        }
        console.log(`Order ${orderId}: ${status}`, message ? ` - ${message}` : '');
    }
    async processOrder(order) {
        if (!this.router) {
            throw new Error('Router not initialized');
        }
        try {
            this.updateStatus(order.id, 'routing');
            const { dex, quote } = await this.router.getBestQuote(order.tokenIn, order.tokenOut, order.amount);
            console.log(`Selected ${dex} for order ${order.id}, price: ${quote.price}`);
            this.updateStatus(order.id, 'building');
            // Simulate building transaction
            this.updateStatus(order.id, 'submitted');
            const result = await this.router.executeSwap(dex, order);
            this.updateStatus(order.id, 'confirmed', undefined, result.txHash, result.executedPrice);
            // Update chosenDex
            await this.repository.updateOrderStatus(order.id, 'confirmed', dex, result.executedPrice, result.txHash);
        }
        catch (error) {
            this.updateStatus(order.id, 'failed', error.message);
            await this.repository.updateOrderStatus(order.id, 'failed', undefined, undefined, undefined, error.message);
            throw error; // Re-throw for worker
        }
    }
    async close() {
        if (this.queue) {
            await this.queue.close();
        }
    }
}
//# sourceMappingURL=queue.js.map