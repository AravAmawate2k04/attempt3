"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const websocket_1 = require("@fastify/websocket");
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = require("path");
const orders_1 = require("./routes/orders");
const orderStatusGateway_1 = require("./ws/orderStatusGateway");
const PORT = Number(process.env.PORT) || 3000;
// Store WebSocket connections by orderId
const wsConnections = new Map();
async function buildServer() {
    const app = (0, fastify_1.default)({
        logger: true, // logs requests, helpful for debugging
    });
    // Register WebSocket plugin (we'll use this later)
    await app.register(websocket_1.fastifyWebsocket);
    // Serve static files from public directory
    await app.register(static_1.default, {
        root: (0, path_1.join)(__dirname, '../public'),
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
    await app.register(orders_1.orderRoutes, { prefix: '/api/orders' });
    // Register WebSocket gateway
    await (0, orderStatusGateway_1.registerOrderStatusWs)(app);
    return app;
}
async function start() {
    const app = await buildServer();
    try {
        await app.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${PORT}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map