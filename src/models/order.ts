export type OrderStatus =
  | 'pending'
  | 'routing'
  | 'building'
  | 'submitted'
  | 'confirmed'
  | 'failed';

export interface Order {
  id: string;             // UUID
  orderType: 'market';    // for now we only support market
  tokenIn: string;
  tokenOut: string;
  amountIn: number;

  status: OrderStatus;

  chosenDex: 'raydium' | 'meteora' | null;
  executedPrice: number | null;
  txHash: string | null;
  failedReason: string | null;

  createdAt: Date;
  updatedAt: Date;
}