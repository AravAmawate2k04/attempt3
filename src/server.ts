import Fastify from 'fastify';
import { fastifyWebsocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { OrderQueue } from './queue';
import { Order, OrderStatus } from './types';

const PORT = Number(process.env.PORT) || 3000;

// Store WebSocket connections by orderId
const wsConnections: Map<string, any> = new Map();

async function buildServer() {
  const app = Fastify({
    logger: true, // logs requests, helpful for debugging
  });

  // Register WebSocket plugin (we'll use this later)
  await app.register(fastifyWebsocket);

  const orderQueue = new OrderQueue();

  // Simple health check route
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // POST /api/orders/execute
  app.post('/api/orders/execute', async (request, reply) => {
    const orderData = request.body as Omit<Order, 'id'>;
    const orderId = uuidv4();
    const order: Order = { id: orderId, ...orderData };

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