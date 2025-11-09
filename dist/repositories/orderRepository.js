"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
exports.createOrder = createOrder;
exports.getOrderById = getOrderById;
exports.updateOrderStatus = updateOrderStatus;
exports.setOrderRoutingDecision = setOrderRoutingDecision;
exports.setOrderExecutionSuccess = setOrderExecutionSuccess;
exports.setOrderExecutionFailed = setOrderExecutionFailed;
const uuid_1 = require("uuid");
const index_1 = require("../db/index");
async function createOrder(input) {
    const id = (0, uuid_1.v4)();
    const status = 'pending';
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
    const { rows } = await (0, index_1.query)(sql, params);
    const row = rows[0];
    const order = {
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
async function getOrderById(orderId) {
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
    const { rows } = await (0, index_1.query)(sql, [orderId]);
    if (rows.length === 0)
        return null;
    const row = rows[0];
    const order = {
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
async function updateOrderStatus(orderId, status) {
    const sql = `
    UPDATE orders
    SET status = $2
    WHERE id = $1
  `;
    await (0, index_1.query)(sql, [orderId, status]);
}
async function setOrderRoutingDecision(orderId, chosenDex) {
    const sql = `
    UPDATE orders
    SET status = 'routing', chosen_dex = $2
    WHERE id = $1
  `;
    await (0, index_1.query)(sql, [orderId, chosenDex]);
}
async function setOrderExecutionSuccess(orderId, executedPrice, txHash) {
    const sql = `
    UPDATE orders
    SET status = 'confirmed',
        executed_price = $2,
        tx_hash = $3
    WHERE id = $1
  `;
    await (0, index_1.query)(sql, [orderId, executedPrice, txHash]);
}
async function setOrderExecutionFailed(orderId, reason) {
    const sql = `
    UPDATE orders
    SET status = 'failed',
        failed_reason = $2
    WHERE id = $1
  `;
    await (0, index_1.query)(sql, [orderId, reason]);
}
class OrderRepository {
    async createOrder(order) {
        const { rows } = await (0, index_1.query)(`INSERT INTO orders (id, order_type, token_in, token_out, amount_in, status, chosen_dex, executed_price, tx_hash, failed_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`, [
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
        ]);
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
    async updateOrderStatus(id, status, chosenDex, executedPrice, txHash, failedReason) {
        const fields = ['status = $2'];
        const values = [id, status];
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
        await (0, index_1.query)(sql, values);
    }
    async getOrderById(id) {
        const { rows } = await (0, index_1.query)('SELECT * FROM orders WHERE id = $1', [id]);
        if (rows.length === 0)
            return null;
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
exports.OrderRepository = OrderRepository;
//# sourceMappingURL=orderRepository.js.map