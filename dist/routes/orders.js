"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const orderRepository_1 = require("../repositories/orderRepository");
const orderQueue_1 = require("../queue/orderQueue"); // ⬅️ add this
const orderRoutes = async (app) => {
    app.post('/execute', async (request, reply) => {
        try {
            const { orderType, tokenIn, tokenOut, amount } = request.body;
            // Basic validation
            if (orderType !== 'market') {
                reply.code(400);
                return { error: 'Only market orders are supported' };
            }
            if (!tokenIn || !tokenOut) {
                reply.code(400);
                return { error: 'tokenIn and tokenOut are required' };
            }
            // Note: For SOL as native token, in a real implementation this would handle wrapping to wSOL
            // Here in mock, we treat SOL as a generic token string
            if (typeof amount !== 'number' || amount <= 0) {
                reply.code(400);
                return { error: 'amount must be a positive number' };
            }
            const order = await (0, orderRepository_1.createOrder)({
                orderType,
                tokenIn,
                tokenOut,
                amountIn: amount,
            });
            // Enqueue job for processing this order
            await orderQueue_1.orderQueue.add('execute', { orderId: order.id }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000, // 1s -> 2s -> 4s
                },
            });
            // For now, we just create the order and return the ID.
            // Queue + WebSocket will be wired in later steps.
            return { orderId: order.id };
        }
        catch (err) {
            request.log.error({ err }, 'Error in /api/orders/execute');
            reply.code(500);
            return { error: 'Internal server error' };
        }
    });
    app.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const order = await (0, orderRepository_1.getOrderById)(id);
            if (!order) {
                reply.code(404);
                return { error: 'Order not found' };
            }
            return order;
        }
        catch (err) {
            request.log.error({ err }, 'Error in /api/orders/:id');
            reply.code(500);
            return { error: 'Internal server error' };
        }
    });
};
exports.orderRoutes = orderRoutes;
//# sourceMappingURL=orders.js.map