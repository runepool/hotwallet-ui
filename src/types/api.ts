// API Types
export interface RuneOrder {
  id?: string;
  rune: string;
  quantity: string;
  price: string;
  type: 'ask' | 'bid';
  filledQuantity?: number;
  createdAt?: string;
}

export interface CreateRuneOrderDto {
  rune: string;
  quantity: string;
  price: string;
  type: 'ask' | 'bid';
}

export interface CreateBatchRuneOrderDto {
  orders: CreateRuneOrderDto[];
}

export interface TokenBalance {
  token: string;
  balance: string;
  address: string;
  decimals: number;
}

export interface Transaction {
  id: string;
  orderId: string;
  rune: string;
  amount: string;
  txid: string;
  price: string;
  type: 'ask' | 'bid';
  status: 'pending' | 'confirming' | 'confirmed' | 'errored';
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}