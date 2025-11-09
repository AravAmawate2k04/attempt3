## Scope & Design Choices

### Order Type

This engine implements a **Market Order** flow.

A market order is defined as an instruction to execute a swap immediately at the best available price across supported DEXs. This keeps the core pipeline focused on routing, execution, and real-time status updates, without needing extra state for price triggers or scheduling.

**How this extends to other order types:**

- **Limit Orders:**  
  The engine would store a target price along with the order and only enqueue the execution job once a price watcher (or external trigger) confirms that the market price has reached the limit level. After that point, the routing + execution flow would reuse exactly the same pipeline as the market order (queue → router → execute → WebSocket updates).

- **Sniper Orders:**  
  The engine would subscribe to a token launch / migration event (or any on-chain/off-chain signal) and, once the event fires, it would create and enqueue a market-style order for that token. Again, the actual routing, swap execution, and status lifecycle would reuse the same components as the market order path.

### Execution Mode

I am using a **Mock Implementation** of the DEX layer:

- Quotes from **Raydium** and **Meteora** are simulated with realistic delays (≈200 ms) and small random price differences (≈2–5%).
- Swap execution is simulated with a 2–3 second delay and returns a fake `txHash` and `executedPrice`.
- This keeps the focus on:
  - clean routing logic,
  - order lifecycle & WebSocket streaming,
  - queue management and retry behaviour.

In a real devnet setup, the mock router can be swapped with adapters that call the actual Raydium and Meteora SDKs over Solana RPC.

### Tech Stack

- **Language:** Node.js + TypeScript  
- **HTTP & WebSocket Server:** Fastify  
- **Queue:** BullMQ + Redis (for order processing and retries)  
- **Database:** PostgreSQL (for persisting order history, status, and failure reasons)  
- **Runtime Architecture:** 
  - One API server (HTTP + WebSocket)
  - One worker process consuming jobs from the order queue

## Current Implementation Status

The following components have been implemented and verified:

- **Project Setup:** Node.js + TypeScript project with Fastify server, BullMQ queue, PostgreSQL DB, and Redis.
- **Health Endpoint:** GET /health returns `{"status": "ok"}` for basic server health check.
- **Database Layer:** PostgreSQL connection, schema with orders table (including triggers for updated_at), and repository functions for creating and updating orders.
- **Order Model:** TypeScript interfaces for Order and OrderStatus.
- **API Endpoint:** POST /api/orders/execute accepts market orders with validation, creates DB record, enqueues job, and returns orderId.
- **Queue Integration:** BullMQ queue for order execution jobs with exponential backoff retries.
- **Worker Process:** Consumes jobs from queue, processes orders (currently dummy processing with logging), supports concurrency of 10.

**Next Steps (Not Yet Implemented):**
- Integrate DEX routing in worker (fetch quotes, select best DEX, simulate execution).
- Add WebSocket updates for real-time order status streaming.
- Implement unit/integration tests.
- Create Postman collection for API testing.
- Deploy to hosting platform with demo video.

## How to Run

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)
- Redis (running locally or via Docker)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/AravAmawate2k04/attempt3.git
   cd attempt3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/dex_orders
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```

4. Initialize the database:
   ```bash
   npm run db:init
   ```

5. Test database connection:
   ```bash
   npm run db:test
   ```

### Running the Application
1. Start the server:
   ```bash
   npm run dev
   ```
   The server runs on http://localhost:3000.

2. In a separate terminal, start the worker:
   ```bash
   npm run worker
   ```

3. Test the API:
   - Health check: `curl http://localhost:3000/health`
   - Create order: `curl -X POST http://localhost:3000/api/orders/execute -H "Content-Type: application/json" -d '{"type": "market", "tokenIn": "SOL", "tokenOut": "USDC", "amount": 1}'`

### Building and Production
- Build: `npm run build`
- Start production: `npm start`

## API Endpoints

- **GET /health**: Health check endpoint.
- **POST /api/orders/execute**: Execute a market order.
  - Body: `{ "type": "market", "tokenIn": string, "tokenOut": string, "amount": number }`
  - Response: `{ "orderId": string }` on success, or error object on failure.

## Database Layer

### PostgreSQL Schema

We use PostgreSQL to persist order history, status updates, and failure reasons as required by the spec. The schema includes:

- `id` (UUID): Unique order identifier
- `order_type`: Currently 'market' (extensible to 'limit', 'sniper')
- `token_in/out`: Token symbols
- `amount_in`: Input amount
- `status`: Order lifecycle status ('pending', 'routing', 'building', 'submitted', 'confirmed', 'failed')
- `chosen_dex`: 'raydium' or 'meteora' (null initially)
- `executed_price`: Final execution price (null until confirmed)
- `tx_hash`: Blockchain transaction hash (null until submitted)
- `failed_reason`: Error details if failed
- `created_at/updated_at`: Timestamps with auto-update trigger

### Alternative Approaches Considered

1. **In-Memory Storage (Not Chosen):**
   - Pros: Simple, fast, no external dependencies
   - Cons: Data lost on restart, no persistence, violates spec requirement for PostgreSQL history

2. **Redis-Only Storage (Not Chosen):**
   - Pros: Fast key-value storage, already used for queues
   - Cons: Not relational, complex queries hard, no ACID transactions, spec requires PostgreSQL

3. **SQLite (Not Chosen):**
   - Pros: File-based, no server setup, good for development
   - Cons: Not suitable for concurrent production use, spec specifies PostgreSQL

4. **ORM vs Raw SQL (Chose Raw SQL):**
   - Considered Prisma/TypeORM for type safety and migrations
   - Chose raw SQL with pg library for simplicity and direct control
   - Flaw: Manual query writing, potential SQL injection if not careful (mitigated with parameterized queries)

### Connection and Initialization

- Uses `pg` Pool for connection management
- Environment-based config via dotenv
- Init script creates table and triggers
- Test script verifies connectivity and schema

### PostgreSQL Schema

We use PostgreSQL to persist order history, status updates, and failure reasons as required by the spec. The schema includes:

- `id` (UUID): Unique order identifier
- `order_type`: Currently 'market' (extensible to 'limit', 'sniper')
- `token_in/out`: Token symbols
- `amount_in`: Input amount
- `status`: Order lifecycle status ('pending', 'routing', 'building', 'submitted', 'confirmed', 'failed')
- `chosen_dex`: 'raydium' or 'meteora' (null initially)
- `executed_price`: Final execution price (null until confirmed)
- `tx_hash`: Blockchain transaction hash (null until submitted)
- `failed_reason`: Error details if failed
- `created_at/updated_at`: Timestamps with auto-update trigger

### Alternative Approaches Considered

1. **In-Memory Storage (Not Chosen):**
   - Pros: Simple, fast, no external dependencies
   - Cons: Data lost on restart, no persistence, violates spec requirement for PostgreSQL history

2. **Redis-Only Storage (Not Chosen):**
   - Pros: Fast key-value storage, already used for queues
   - Cons: Not relational, complex queries hard, no ACID transactions, spec requires PostgreSQL

3. **SQLite (Not Chosen):**
   - Pros: File-based, no server setup, good for development
   - Cons: Not suitable for concurrent production use, spec specifies PostgreSQL

4. **ORM vs Raw SQL (Chose Raw SQL):**
   - Considered Prisma/TypeORM for type safety and migrations
   - Chose raw SQL with pg library for simplicity and direct control
   - Flaw: Manual query writing, potential SQL injection if not careful (mitigated with parameterized queries)

### Connection and Initialization

- Uses `pg` Pool for connection management
- Environment-based config via dotenv
- Init script creates table and triggers
- Test script verifies connectivity and schema