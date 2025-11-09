"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
async function main() {
    try {
        const { rows } = await (0, index_1.query)('SELECT NOW()');
        console.log('DB time:', rows[0].now);
        const { rows: tableRows } = await (0, index_1.query)("SELECT table_name FROM information_schema.tables WHERE table_name = 'orders';");
        console.log('Orders table exists?', tableRows.length > 0);
    }
    catch (err) {
        console.error('DB test error:', err);
    }
    finally {
        process.exit(0);
    }
}
main();
//# sourceMappingURL=testConnection.js.map