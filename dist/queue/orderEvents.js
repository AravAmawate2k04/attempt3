"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisSub = exports.redisPub = exports.ORDER_STATUS_CHANNEL = void 0;
exports.publishOrderStatus = publishOrderStatus;
const ioredis_1 = __importDefault(require("ioredis"));
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
exports.ORDER_STATUS_CHANNEL = 'order-status';
exports.redisPub = new ioredis_1.default({
    host: redisHost,
    port: redisPort,
});
exports.redisSub = new ioredis_1.default({
    host: redisHost,
    port: redisPort,
});
async function publishOrderStatus(event) {
    await exports.redisPub.publish(exports.ORDER_STATUS_CHANNEL, JSON.stringify(event));
}
//# sourceMappingURL=orderEvents.js.map