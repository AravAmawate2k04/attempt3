import fs from 'fs';
import { query } from './index';
async function initDB() {
    try {
        const sql = fs.readFileSync('sql/create_orders_table.sql', 'utf8');
        await query(sql);
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