"use client";

import { useWalletStore } from "@/lib/stores/wallet-store";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function WalletConnectButton() {
  const {
    isConnected,
    isConnecting,
    address,
    connectWallet,
    disconnectWallet,
    error,
  } = useWalletStore();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button variant="outline" onClick={handleDisconnect} size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={handleConnect} disabled={isConnecting} size="sm">
        {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
