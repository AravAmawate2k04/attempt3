import Fastify from 'fastify';
import { fastifyWebsocket } from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import '@fastify/static';
import { join } from 'path';
import { orderRoutes } from './routes/orders';
import { registerOrderStatusWs } from './ws/orderStatusGateway';

const PORT = Number(process.env.PORT) || 3000;

// Store WebSocket connections by orderId
const wsConnections: Map<string, any> = new Map();

async function buildServer() {
  const app = Fastify({
    logger: true, // logs requests, helpful for debugging
  });

  // Register WebSocket plugin (we'll use this later)
  await app.register(fastifyWebsocket);

  // Serve static files from public directory
  await app.register(fastifyStatic, {
    root: join(__dirname, '../public'),
  });

  // Root route to serve index.html
  app.get('/', async (req, reply) => {
    return reply.sendFile('index.html');
  });

  // Simple health check route
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // Order routes (prefix: /api/orders)
  await app.register(orderRoutes, { prefix: '/api/orders' });

  // Register WebSocket gateway
  await registerOrderStatusWs(app);

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