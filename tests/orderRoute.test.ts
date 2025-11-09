import { FastifyInstance } from 'fastify';
import { orderRoutes } from '../src/routes/orders';
import Fastify from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify({ logger: false });
  await app.register(orderRoutes, { prefix: '/api/orders' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('POST /api/orders/execute', () => {
  it('creates an order with valid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        orderType: 'market',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 1,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { orderId: string };
    expect(body.orderId).toBeDefined();
  });

  it('rejects non-market orderType', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        orderType: 'limit',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 1,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid amount', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        orderType: 'market',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 0,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects missing tokenIn', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/orders/execute',
      payload: {
        orderType: 'market',
        tokenOut: 'USDC',
        amount: 1,
      },
    });

    expect(res.statusCode).toBe(400);
  });
});