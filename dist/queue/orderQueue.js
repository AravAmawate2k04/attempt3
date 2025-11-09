"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueue = exports.ORDER_QUEUE_NAME = exports.redisConnection = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
exports.redisConnection = new ioredis_1.default({
    host: redisHost,
    port: redisPort,
});
exports.ORDER_QUEUE_NAME = 'order-execution';
exports.orderQueue = new bullmq_1.Queue(exports.ORDER_QUEUE_NAME, {
    connection: exports.redisConnection,
});
//# sourceMappingURL=orderQueue.js.map