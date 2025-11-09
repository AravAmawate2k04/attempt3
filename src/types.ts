// Order types
export interface Order {
  id: string;
  type: 'market'; // Only market for now
  tokenIn: string;
  tokenOut: string;
  amount: number; // Amount in tokenIn
  slippage?: number; // Default 0.01
  userId?: string; // Optional
}

export interface OrderStatus {
  orderId: string;
  status: 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';
  message?: string;
  txHash?: string;
  executedPrice?: number;
  timestamp: Date;
}

// DEX Quote
export interface DexQuote {
  dex: 'raydium' | 'meteora';
  price: number; // Price of tokenOut in terms of tokenIn
  fee: number;
}

// Execution Result
export interface ExecutionResult {
  txHash: string;
  executedPrice: number;
}