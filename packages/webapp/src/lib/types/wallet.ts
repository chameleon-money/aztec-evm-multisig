import type { Wallet } from "@aztec/aztec.js/wallet";

/**
 * Wallet connection result
 */
export interface WalletConnection {
  wallet: Wallet;
  address: string;
}

/**
 * Wallet error types
 */
export interface WalletError {
  code: string;
  message: string;
}

/**
 * Wallet state
 */
export interface WalletState {
  wallet: Wallet | null;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}
