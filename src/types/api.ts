// API Types
export interface RuneOrder {
  id?: string;
  rune: string;
  quantity: string;
  price: string;
  type: 'ask' | 'bid';
  filledQuantity?: string;
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

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  ERRORED = 'errored'
}

export interface Transaction {
  id: string;
  orderId: string;
  rune: string;
  amount: string;
  price: string;
  type: 'buy' | 'sell';
  status: TransactionStatus;
  txid: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  bitcoinPrivateKey?: string;
  ordUrl: string;
  websocketUrl: string;
  hasPassword?: boolean;
  password?: string; // Used for authentication when updating settings
}

export type OutputHealth = {
  location: string;
  value?: number;
  script_pubkey?: string;
  address?: string;
  transaction?: string;
  sat_ranges?: number[][];
  inscriptions?: string[];
  runes?: Record<string, { amount: number }>;
  amount?: number;
};

export type OutputsHealth = {
  [key: string]: OutputHealth[];
};

export interface SplitAssetRequest {
  asset_name: string;    // Name of the asset to split
  splits: number;        // Number of splits to create (min: 1)
  amount_per_split: number; // Amount per split (min: 1)
}

export enum WarningType {
  LOW_LIQUIDITY = 'LOW_LIQUIDITY',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BALANCE_ERROR = 'BALANCE_ERROR',
  ORDER_ERROR = 'ORDER_ERROR'
}

export interface AppWarning {
  id: string;
  type: WarningType;
  message: string;
  data?: any;
  timestamp: number;
}

export interface AutoSplitConfig {
  asset_name: string;    // Name of the rune/asset
  enabled: boolean;      // Whether auto-split is enabled
  max_cost: number;      // Maximum cost in sats for auto-split transactions
  split_size: number;    // Size of each split in the asset amount
}

export interface AutoRebalancingSettings {
  enabled: boolean;
  spread: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}