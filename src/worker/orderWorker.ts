import { Worker, Job } from 'bullmq';
import { ORDER_QUEUE_NAME, redisConnection } from '../queue/orderQueue';

async function processOrder(job: Job) {
  const { orderId } = job.data as { orderId: string };

  // For now, just log. We'll add real lifecycle + routing next.
  console.log(`Worker: processing order ${orderId}, jobId=${job.id}`);

  // Simulate a bit of work
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`Worker: finished (dummy) processing for order ${orderId}`);
}

function startWorker() {
  const worker = new Worker(
    ORDER_QUEUE_NAME,
    async (job) => {
      try {
        await processOrder(job);
      } catch (err) {
        console.error('Worker error processing job', job.id, err);
        throw err; // let BullMQ handle retries
      }
    },
    {
      connection: redisConnection,
      concurrency: 10, // supports up to 10 concurrent orders
    }
  );

  worker.on('completed', (job) => {
    console.log(`Worker: job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Worker: job ${job?.id} failed`, err);
  });

  console.log('Order worker started');
}

startWorker();