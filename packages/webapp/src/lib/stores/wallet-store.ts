import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Wallet } from "@aztec/aztec.js/wallet";
import {
  connectAzguardWallet,
  disconnectAzguardWallet,
  autoReconnect,
  getWalletInstance,
} from "@/lib/wallet/aztec-wallet";

interface WalletState {
  // State
  wallet: Wallet | null;
  address: string | null;
  isConnecting: boolean;
  error: string | null;

  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  autoReconnectWallet: () => Promise<void>;
  clearError: () => void;

  // Computed
  isConnected: boolean;
  formattedAddress: string;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      wallet: null,
      address: null,
      isConnecting: false,
      error: null,
      isConnected: false,
      formattedAddress: "",

      // Connect wallet
      connectWallet: async () => {
        set({ isConnecting: true, error: null });
        try {
          const { wallet, address } = await connectAzguardWallet();
          set({
            wallet,
            address,
            isConnected: true,
            formattedAddress: formatAddress(address),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to connect wallet";
          set({ error: message });
          throw error;
        } finally {
          set({ isConnecting: false });
        }
      },

      // Disconnect wallet
      disconnectWallet: async () => {
        try {
          await disconnectAzguardWallet();
          set({
            wallet: null,
            address: null,
            error: null,
            isConnected: false,
            formattedAddress: "",
          });
        } catch (error) {
          console.error("Error disconnecting wallet:", error);
          // Clear state anyway
          set({
            wallet: null,
            address: null,
            error: null,
            isConnected: false,
            formattedAddress: "",
          });
        }
      },

      // Auto-reconnect wallet (called on app load)
      autoReconnectWallet: async () => {
        try {
          const result = await autoReconnect();
          if (result) {
            set({
              wallet: result.wallet,
              address: result.address,
              isConnected: true,
              formattedAddress: formatAddress(result.address),
            });
          }
        } catch (error) {
          console.debug("Auto-reconnect failed:", error);
          // Don't set error on auto-reconnect failure
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: "chameleon-wallet-storage",
      // Only persist the address, not the wallet instance
      partialize: (state) => ({ address: state.address }),
      // After hydration, try to reconnect if we have an address
      onRehydrateStorage: () => (state) => {
        if (state?.address) {
          // Auto-reconnect on hydration
          state.autoReconnectWallet();
        }
      },
    },
  ),
);

/**
 * Helper to format address for display
 */
function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Hook to get wallet instance directly
 */
export function useWallet(): Wallet | null {
  return getWalletInstance();
}
