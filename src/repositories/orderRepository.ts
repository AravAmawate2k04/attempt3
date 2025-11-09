import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index';
import { Order, OrderStatus } from '../models/order';

interface CreateOrderInput {
  orderType: 'market';
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const id = uuidv4();

  const status: OrderStatus = 'pending';

  const sql = `
    INSERT INTO orders (
      id,
      order_type,
      token_in,
      token_out,
      amount_in,
      status,
      chosen_dex,
      executed_price,
      tx_hash,
      failed_reason
    )
    VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, NULL, NULL)
    RETURNING
      id,
      order_type,
      token_in,
      token_out,
      amount_in,
      status,
      chosen_dex,
      executed_price,
      tx_hash,
      failed_reason,
      created_at,
      updated_at
  `;

  const params = [
    id,
    input.orderType,
    input.tokenIn,
    input.tokenOut,
    input.amountIn,
    status,
  ];

  const { rows } = await query(sql, params);
  const row = rows[0];

  const order: Order = {
    id: row.id,
    orderType: row.order_type,
    tokenIn: row.token_in,
    tokenOut: row.token_out,
    amountIn: Number(row.amount_in),
    status: row.status,
    chosenDex: row.chosen_dex,
    executedPrice: row.executed_price !== null ? Number(row.executed_price) : null,
    txHash: row.tx_hash,
    failedReason: row.failed_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return order;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const sql = `
    SELECT
      id,
      order_type,
      token_in,
      token_out,
      amount_in,
      status,
      chosen_dex,
      executed_price,
      tx_hash,
      failed_reason,
      created_at,
      updated_at
    FROM orders
    WHERE id = $1
  `;

  const { rows } = await query(sql, [orderId]);
  if (rows.length === 0) return null;

  const row = rows[0];

  const order: Order = {
    id: row.id,
    orderType: row.order_type,
    tokenIn: row.token_in,
    tokenOut: row.token_out,
    amountIn: Number(row.amount_in),
    status: row.status,
    chosenDex: row.chosen_dex,
    executedPrice: row.executed_price !== null ? Number(row.executed_price) : null,
    txHash: row.tx_hash,
    failedReason: row.failed_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const sql = `
    UPDATE orders
    SET status = $2
    WHERE id = $1
  `;
  await query(sql, [orderId, status]);
}

export async function setOrderRoutingDecision(
  orderId: string,
  chosenDex: 'raydium' | 'meteora'
) {
  const sql = `
    UPDATE orders
    SET status = 'routing', chosen_dex = $2
    WHERE id = $1
  `;
  await query(sql, [orderId, chosenDex]);
}

export async function setOrderExecutionSuccess(
  orderId: string,
  executedPrice: number,
  txHash: string
) {
  const sql = `
    UPDATE orders
    SET status = 'confirmed',
        executed_price = $2,
        tx_hash = $3
    WHERE id = $1
  `;
  await query(sql, [orderId, executedPrice, txHash]);
}

export async function setOrderExecutionFailed(
  orderId: string,
  reason: string
) {
  const sql = `
    UPDATE orders
    SET status = 'failed',
        failed_reason = $2
    WHERE id = $1
  `;
  await query(sql, [orderId, reason]);
}

export class OrderRepository {
  async createOrder(order: Omit<Order, 'createdAt' | 'updatedAt'>): Promise<Order> {
    const { rows } = await query(
      `INSERT INTO orders (id, order_type, token_in, token_out, amount_in, status, chosen_dex, executed_price, tx_hash, failed_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        order.id,
        order.orderType,
        order.tokenIn,
        order.tokenOut,
        order.amountIn,
        order.status,
        order.chosenDex,
        order.executedPrice,
        order.txHash,
        order.failedReason,
      ]
    );
    const row = rows[0];
    return {
      id: row.id,
      orderType: row.order_type,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amountIn: parseFloat(row.amount_in),
      status: row.status,
      chosenDex: row.chosen_dex,
      executedPrice: row.executed_price ? parseFloat(row.executed_price) : null,
      txHash: row.tx_hash,
      failedReason: row.failed_reason,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus, chosenDex?: 'raydium' | 'meteora' | null, executedPrice?: number | null, txHash?: string | null, failedReason?: string | null): Promise<void> {
    const fields: string[] = ['status = $2'];
    const values: any[] = [id, status];
    let paramIndex = 3;

    if (chosenDex !== undefined) {
      fields.push(`chosen_dex = $${paramIndex++}`);
      values.push(chosenDex);
    }
    if (executedPrice !== undefined) {
      fields.push(`executed_price = $${paramIndex++}`);
      values.push(executedPrice);
    }
    if (txHash !== undefined) {
      fields.push(`tx_hash = $${paramIndex++}`);
      values.push(txHash);
    }
    if (failedReason !== undefined) {
      fields.push(`failed_reason = $${paramIndex++}`);
      values.push(failedReason);
    }

    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = $1`;
    await query(sql, values);
  }

  async getOrderById(id: string): Promise<Order | null> {
    const { rows } = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      orderType: row.order_type,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amountIn: parseFloat(row.amount_in),
      status: row.status,
      chosenDex: row.chosen_dex,
      executedPrice: row.executed_price ? parseFloat(row.executed_price) : null,
      txHash: row.tx_hash,
      failedReason: row.failed_reason,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}