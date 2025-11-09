import { Worker, Queue } from 'bullmq';
import { MockDexRouter } from './dexRouter';
import { Order, OrderStatus } from './types';

export class OrderQueue {
  private queue: Queue;
  private router: MockDexRouter;
  private statusCallbacks: Map<string, (status: OrderStatus) => void> = new Map();

  constructor() {
    this.queue = new Queue('orders', {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    });
    this.router = new MockDexRouter();

    // Set up worker
    const worker = new Worker('orders', async (job) => {
      const order: Order = job.data;
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

  async addOrder(order: Order): Promise<void> {
    await this.queue.add('execute', order, { removeOnComplete: 10, removeOnFail: 5 });
    this.updateStatus(order.id, 'pending');
  }

  registerStatusCallback(orderId: string, callback: (status: OrderStatus) => void): void {
    this.statusCallbacks.set(orderId, callback);
  }

  private updateStatus(orderId: string, status: OrderStatus['status'], message?: string, txHash?: string, executedPrice?: number): void {
    const orderStatus: OrderStatus = {
      orderId,
      status,
      message,
      txHash,
      executedPrice,
      timestamp: new Date(),
    };
    const callback = this.statusCallbacks.get(orderId);
    if (callback) {
      callback(orderStatus);
    }
    console.log(`Order ${orderId}: ${status}`, message ? ` - ${message}` : '');
  }

  private async processOrder(order: Order): Promise<void> {
    try {
      this.updateStatus(order.id, 'routing');
      const { dex, quote } = await this.router.getBestQuote(order.tokenIn, order.tokenOut, order.amount);
      console.log(`Selected ${dex} for order ${order.id}, price: ${quote.price}`);

      this.updateStatus(order.id, 'building');
      // Simulate building transaction

      this.updateStatus(order.id, 'submitted');
      const result = await this.router.executeSwap(dex, order);

      this.updateStatus(order.id, 'confirmed', undefined, result.txHash, result.executedPrice);
    } catch (error) {
      this.updateStatus(order.id, 'failed', (error as Error).message);
      throw error; // Re-throw for worker
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}