"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const index_1 = require("./index");
async function initDB() {
    try {
        const sql = fs_1.default.readFileSync('sql/create_orders_table.sql', 'utf8');
        await (0, index_1.query)(sql);
        console.log('Orders table created successfully');
    }
    catch (err) {
        console.error('Error creating table:', err);
    }
    finally {
        process.exit(0);
    }
}
initDB();
//# sourceMappingURL=init.js.map