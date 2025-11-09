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