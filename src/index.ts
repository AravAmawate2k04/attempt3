import Fastify from 'fastify';
import { fastifyWebsocket } from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { OrderQueue } from './queue';
import { Order, OrderStatus } from './types';

const fastify = Fastify({ logger: true });

// Register WebSocket plugin
fastify.register(fastifyWebsocket);

const orderQueue = new OrderQueue();

// Store WebSocket connections by orderId
const wsConnections: Map<string, any> = new Map();

// POST /api/orders/execute
fastify.post('/api/orders/execute', async (request, reply) => {
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
fastify.get('/ws/orders/:orderId', { websocket: true }, (connection, req) => {
  const { orderId } = req.params as { orderId: string };
  wsConnections.set(orderId, connection.socket);

  connection.socket.on('close', () => {
    wsConnections.delete(orderId);
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();