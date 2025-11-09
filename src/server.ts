import Fastify from 'fastify';
import { fastifyWebsocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { OrderQueue } from './queue';
import { Order, OrderStatus } from './types';
import { OrderRepository } from './repositories/orderRepository';

const PORT = Number(process.env.PORT) || 3000;

// Store WebSocket connections by orderId
const wsConnections: Map<string, any> = new Map();

async function buildServer() {
  const app = Fastify({
    logger: true, // logs requests, helpful for debugging
  });

  // Register WebSocket plugin (we'll use this later)
  await app.register(fastifyWebsocket);

  const orderRepository = new OrderRepository();
  const orderQueue = new OrderQueue(orderRepository);

  // Simple health check route
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // POST /api/orders/execute
  app.post('/api/orders/execute', async (request, reply) => {
    const body = request.body as any;
    // Basic validation
    if (!body.type || body.type !== 'market' || !body.tokenIn || !body.tokenOut || typeof body.amount !== 'number' || body.amount <= 0) {
      return reply.code(400).send({ error: 'Invalid order data' });
    }

    const orderId = uuidv4();
    const order: Order = {
      id: orderId,
      type: body.type,
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amount: body.amount,
      slippage: body.slippage,
    };

    // Create in DB with status pending
    await orderRepository.createOrder({
      id: orderId,
      orderType: 'market',
      tokenIn: body.tokenIn,
      tokenOut: body.tokenOut,
      amountIn: body.amount,
      status: 'pending',
      chosenDex: null,
      executedPrice: null,
      txHash: null,
      failedReason: null,
    });

    // Add to queue
    await orderQueue.addOrder(order);

    // Register callback for status updates
    orderQueue.registerStatusCallback(orderId, (status: OrderStatus) => {
      const ws = wsConnections.get(orderId);
      if (ws) {
        ws.send(JSON.stringify(status));
        if (status.status === 'confirmed' || status.status === 'failed') {
          ws.close();
          wsConnections.delete(orderId);
        }
      }
    });

    reply.send({ orderId });
  });

  // WebSocket route for status updates
  app.get('/ws/orders/:orderId', { websocket: true }, (connection, req) => {
    const { orderId } = req.params as { orderId: string };
    wsConnections.set(orderId, connection.socket);

    connection.socket.on('close', () => {
      wsConnections.delete(orderId);
    });
  });

  return app;
}

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();