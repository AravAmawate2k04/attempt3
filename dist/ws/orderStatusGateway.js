import { redisSub, ORDER_STATUS_CHANNEL, } from '../queue/orderEvents.js';
export async function registerOrderStatusWs(app) {
    const clients = new Map();
    // Subscribe to Redis channel
    await redisSub.subscribe(ORDER_STATUS_CHANNEL);
    redisSub.on('message', (channel, message) => {
        if (channel !== ORDER_STATUS_CHANNEL)
            return;
        let event;
        try {
            event = JSON.parse(message);
        }
        catch (err) {
            app.log.error({ err }, 'Failed to parse order status event');
            return;
        }
        const sockets = clients.get(event.orderId);
        if (!sockets || sockets.size === 0) {
            return;
        }
        const payload = JSON.stringify({
            type: 'status',
            orderId: event.orderId,
            status: event.status,
            txHash: event.txHash,
            chosenDex: event.chosenDex,
            error: event.error,
        });
        for (const socket of sockets) {
            try {
                socket.socket.send(payload);
            }
            catch (err) {
                app.log.error({ err }, 'Error sending WS message');
            }
        }
    });
    // WebSocket endpoint: /ws/orders/:orderId
    app.get('/ws/orders/:orderId', { websocket: true }, (connection, req) => {
        const { orderId } = req.params;
        app.log.info({ orderId }, 'WS client connected for order');
        let set = clients.get(orderId);
        if (!set) {
            set = new Set();
            clients.set(orderId, set);
        }
        set.add(connection);
        // Initial ack
        connection.socket.send(JSON.stringify({
            type: 'connected',
            orderId,
        }));
        connection.socket.on('close', () => {
            const set = clients.get(orderId);
            if (!set)
                return;
            set.delete(connection);
            if (set.size === 0) {
                clients.delete(orderId);
            }
            app.log.info({ orderId }, 'WS client disconnected for order');
        });
    });
}
//# sourceMappingURL=orderStatusGateway.js.map