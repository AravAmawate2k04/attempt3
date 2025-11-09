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
- **Queue Integration:** BullMQ queue for order execution jobs with exponential backoff retries (up to 3 attempts).
- **Worker Process:** Consumes jobs from queue, processes orders through full lifecycle (pending → routing → building → submitted → confirmed/failed), fetches quotes from mock DEX router (Raydium vs Meteora), selects best route based on effective output after fees, and simulates execution with random delays and fake tx_hashes. Handles failures with retries and final failed status.
- **Mock DEX Router:** Simulates quote fetching from Raydium and Meteora with realistic delays (200-400ms), random price variance (±5%), and different fees (30bps for Raydium, 25bps for Meteora), compares effective output to choose the best DEX.
- **Real-time WebSocket Updates:** WebSocket endpoint at /ws/orders/:orderId streams order status updates in real-time as the worker progresses through the lifecycle. Uses Redis pub/sub for event broadcasting. Clients receive JSON messages like `{"type": "status", "orderId": "...", "status": "routing", "chosenDex": "raydium"}` or `{"type": "status", "orderId": "...", "status": "failed", "error": "..."}`.
- **Automated Tests:** Jest setup with 10 tests covering DEX routing logic (Raydium vs Meteora selection), order repository DB operations (create, fetch, update status, routing decision, success/failure), and API route validations (valid payloads, rejections for invalid inputs).

**Next Steps (Not Yet Implemented):**
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
   - Create order: `curl -X POST http://localhost:3000/api/orders/execute -H "Content-Type: application/json" -d '{"orderType": "market", "tokenIn": "SOL", "tokenOut": "USDC", "amount": 1}'`

4. Run tests:
   ```bash
   npm test
   ```

### Building and Production
- Build: `npm run build`
- Start production: `npm start`

## API Endpoints

- **GET /health**: Health check endpoint.
- **POST /api/orders/execute**: Execute a market order.
  - Body: `{ "orderType": "market", "tokenIn": string, "tokenOut": string, "amount": number }`
  - Response: `{ "orderId": string }` on success, or error object on failure.

## Postman Collection

The `postman/collection.json` file contains requests for:

- `GET /health`
- `POST /api/orders/execute` (valid + invalid payloads)

You can import it into Postman or Insomnia to quickly test the API locally.

## Frontend Demo

A simple web UI is included at the root URL (`/`) for demonstration purposes.

**Features:**
- Clean, responsive card-based layout
- Order creation form with validation
- Real-time status timeline via WebSocket
- Order history with status indicators
- Visual feedback for different order states

**Usage:**
1. Start the server (`npm run dev`)
2. Open `http://localhost:3000` in your browser
3. Fill the form and submit to see live order processing
4. Status updates appear in real-time as the backend processes the order

The UI demonstrates the full flow: form submission → API call → queue processing → WebSocket updates → final status display.

## Running Locally

### Prerequisites

- Node.js >= 18
- Docker (for Postgres + Redis), or local Postgres + Redis installs

### 1) Start Postgres and Redis via Docker

```bash
docker run --name dex-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=dex_orders -p 5432:5432 -d postgres

docker run --name dex-redis -p 6379:6379 -d redis
```

### 2) Clone and install dependencies
```bash
git clone <your-repo-url>
cd <your-repo>
npm install
```

### 3) Setup environment

Create `.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/dex_orders
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Run the DB migration:

```bash
psql "postgres://postgres:postgres@localhost:5432/dex_orders" -f sql/create_orders_table.sql
```

### 4) Run worker + server
```bash
# Terminal 1
npm run worker

# Terminal 2
npm run dev
```

### 5) Test
```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"orderType":"market","tokenIn":"SOL","tokenOut":"USDC","amount":1}'
```

Then connect a WebSocket client to:

```
ws://localhost:3000/ws/orders/<orderId>
```

### 6) Run tests
```bash
npm test
```

## Spec Compliance Notes

### HTTP → WebSocket Pattern
The spec requests a "single endpoint" that handles both HTTP POST and WebSocket upgrades. Currently, we use separate endpoints for clarity:
- `POST /api/orders/execute` for order creation
- `ws://.../ws/orders/:orderId` for status updates

For strict spec compliance, the WS endpoint also accepts connections at `ws://.../api/orders/execute?orderId=...` (same path, query param for orderId).

### DEX Router Requirements
- ✅ Queries both Raydium & Meteora
- ✅ Routes to best effective price after fees
- ✅ Logs routing decisions
- Note: Wrapped SOL handling is conceptually supported (SOL treated as wSOL in mock layer); in real devnet, SOL would be wrapped before swaps.

### Slippage Protection
Implemented 1% max slippage threshold. If executed price deviates >1% from quoted price, order fails with "Slippage too high" error.

### Concurrency & Throughput
With 10 concurrent workers and ~2.5s execution time, system can process ~240 orders/minute. Local testing with 50 orders completes in ~25 seconds, exceeding the 100 orders/min requirement.

### Test Coverage
10+ tests cover:
- DEX routing logic
- DB operations
- API validations
- Integration: queue processing simulation
- WebSocket event publishing (mocked)

## Limitations & Assumptions
- Mock DEX layer (easily replaceable with real SDKs)
- No user-configurable slippage (fixed 1% threshold)
- Single order type (market) implemented
- Local deployment only (no cloud hosting in this submission)

## Deliverables Status
- ✅ GitHub repo with complete code
- ✅ README with setup, design, and usage
- ✅ Postman collection (postman/collection.json)
- ✅ 10+ automated tests (npm test)
- ✅ Local demo UI at http://localhost:3000
- ❓ Deployment to free hosting (not included; local setup provided)
- ❓ YouTube demo video (not included; local testing instructions provided)

## Database Layer

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