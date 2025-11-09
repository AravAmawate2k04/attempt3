import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  setOrderRoutingDecision,
  setOrderExecutionSuccess,
  setOrderExecutionFailed,
} from '../src/repositories/orderRepository';
import { query } from '../src/db';
import type { OrderStatus } from '../src/models/order';

describe('OrderRepository', () => {
  beforeAll(async () => {
    // Clean table before tests
    await query('DELETE FROM orders');
  });

  it('creates and fetches an order', async () => {
    const order = await createOrder({
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 1,
    });

    expect(order.id).toBeDefined();
    expect(order.orderType).toBe('market');
    expect(order.status).toBe('pending');

    const fetched = await getOrderById(order.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(order.id);
    expect(fetched!.tokenIn).toBe('SOL');
    expect(fetched!.tokenOut).toBe('USDC');
    expect(fetched!.amountIn).toBe(1);
  });

  it('updates order status', async () => {
    const order = await createOrder({
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDT',
      amountIn: 2,
    });

    await updateOrderStatus(order.id, 'building');

    const updated = await getOrderById(order.id);
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('building');
  });

  it('sets routing decision, success and failure correctly', async () => {
    const order = await createOrder({
      orderType: 'market',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 3,
    });

    await setOrderRoutingDecision(order.id, 'raydium');
    let updated = await getOrderById(order.id);
    expect(updated!.status).toBe('routing');
    expect(updated!.chosenDex).toBe('raydium');

    await setOrderExecutionSuccess(order.id, 20.5, '0xtesthash');
    updated = await getOrderById(order.id);
    expect(updated!.status).toBe('confirmed');
    expect(updated!.executedPrice).toBe(20.5);
    expect(updated!.txHash).toBe('0xtesthash');

    await setOrderExecutionFailed(order.id, 'some failure');
    updated = await getOrderById(order.id);
    expect(updated!.status).toBe('failed');
    expect(updated!.failedReason).toBe('some failure');
  });

  it('returns null for non-existent order', async () => {
    const fetched = await getOrderById('00000000-0000-0000-0000-000000000000');
    expect(fetched).toBeNull();
  });
});