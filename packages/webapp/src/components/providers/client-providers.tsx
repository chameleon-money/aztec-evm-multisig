"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/lib/stores/wallet-store";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { autoReconnectWallet } = useWalletStore();

  useEffect(() => {
    // Auto-reconnect wallet on mount
    autoReconnectWallet();
  }, [autoReconnectWallet]);

  return <>{children}</>;
}
