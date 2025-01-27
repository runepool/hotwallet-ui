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
  price: string;
  type: 'ask' | 'bid';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  bitcoinPrivateKey?: string;
  ordUrl: string;
  nostrRelays: string[];
  nostrPrivateKey: string;
  nostrPublicKey?: string; // Derived from private key, read-only
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}