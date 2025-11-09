import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dex_orders',
});
export async function query(text, params) {
    const res = await pool.query(text, params);
    return { rows: res.rows };
}
export async function getClient() {
    return pool.connect();
}
//# sourceMappingURL=index.js.map