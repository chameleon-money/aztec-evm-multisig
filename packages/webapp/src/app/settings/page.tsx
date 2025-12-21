"use client";

import {
  AlertCircle,
  Edit,
  ExternalLink,
  Loader2,
  Minus,
  Plus,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { createMultiSigService } from "@/lib/contracts/multisig";
import { validatePublicEnv } from "@/lib/env";
import { useWalletStore } from "@/lib/stores/wallet-store";

export default function SettingsPage() {
  const { isConnected, address, wallet } = useWalletStore();
  const [config, setConfig] = useState({
    threshold: 0,
    totalSigners: 0,
    isCurrentUserSigner: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      if (!isConnected || !wallet || !address) return;

      setIsLoading(true);
      setError(null);

      try {
        const service = createMultiSigService(wallet);
        await service.initialize();

        const [threshold, totalSigners, isCurrentUserSigner] =
          await Promise.all([
            service.getThreshold(),
            service.getSignerCount(),
            service.isSigner(address),
          ]);

        setConfig({
          threshold,
          totalSigners,
          isCurrentUserSigner,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load settings";
        setError(message);
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, [isConnected, wallet, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Chameleon Money</h1>
            </Link>
            <WalletConnectButton />
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold">Connect Your Wallet</h2>
            <p className="text-xl text-muted-foreground">
              Please connect your Azguard wallet to access settings
            </p>
            <WalletConnectButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Chameleon Money</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/proposals"
                className="text-sm font-medium hover:text-primary"
              >
                Proposals
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-primary"
              >
                Settings
              </Link>
            </nav>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">MultiSig Settings</h2>
          <p className="text-muted-foreground">
            View and manage your MultiSig configuration
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">
                Failed to load settings
              </h4>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading contract settings...
              </p>
            </div>
          </div>
        )}

        {/* Current Configuration */}
        {!isLoading && config.totalSigners > 0 && (
          <div className="grid gap-6 mb-8">
            {/* Threshold Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Signature Threshold
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Number of signatures required to execute proposals
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/proposals/new?type=change_threshold">
                      <Edit className="h-4 w-4 mr-2" />
                      Change
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {config.threshold}
                    <span className="text-2xl text-muted-foreground">
                      {" "}
                      / {config.totalSigners}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {config.threshold} signature
                    {config.threshold !== 1 ? "s" : ""} required out of{" "}
                    {config.totalSigners} signer
                    {config.totalSigners !== 1 ? "s" : ""}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signers Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Authorized Signers
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Total number of authorized signers
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/proposals/new?type=add_signer">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/proposals/new?type=remove_signer">
                        <Minus className="h-4 w-4 mr-2" />
                        Remove
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">
                      {config.totalSigners}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      authorized signer{config.totalSigners !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Current User Status */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            Your Address
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {address
                              ? `${address.slice(0, 10)}...${address.slice(-8)}`
                              : "Not connected"}
                          </div>
                        </div>
                      </div>
                      {config.isCurrentUserSigner ? (
                        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md">
                          <span className="text-xs font-medium">
                            Authorized Signer
                          </span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-muted rounded-md">
                          <span className="text-xs font-medium text-muted-foreground">
                            Not a Signer
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Contract Information
                </CardTitle>
                <CardDescription>
                  MultiSig and Treasury contract addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">
                    MultiSig Contract Address
                  </div>
                  <a
                    href={`https://devnet.aztecscan.xyz/contracts/instances/${process.env.NEXT_PUBLIC_MULTISIG_CONTRACT_ADDRESS || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-mono text-sm text-primary hover:text-primary/80 bg-muted p-2 rounded group transition-colors"
                  >
                    <span className="flex-1 truncate">
                      {process.env.NEXT_PUBLIC_MULTISIG_CONTRACT_ADDRESS ||
                        "Not configured"}
                    </span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view on Aztec Explorer
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">
                    Treasury Contract Address
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/address/${process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS || ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-mono text-sm text-primary hover:text-primary/80 bg-muted p-2 rounded group transition-colors"
                  >
                    <span className="flex-1 truncate">
                      {process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS ||
                        "Not configured"}
                    </span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to view on Etherscan Sepolia
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Networks</div>
                  <div className="text-sm text-muted-foreground">
                    MultiSig: Aztec Devnet • Treasury: Ethereum Sepolia
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Warning Card */}
        {!isLoading &&
          config.totalSigners > 0 &&
          !config.isCurrentUserSigner && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Warning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Your connected address is not an authorized signer. You can
                  view the MultiSig configuration but cannot create or sign
                  proposals.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Info Card */}
        {!isLoading && config.totalSigners > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About MultiSig Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong>Threshold:</strong> The minimum number of signatures
                required to execute a proposal. For example, with a threshold of
                2 and 3 signers, at least 2 signers must approve before
                execution.
              </p>
              <p>
                <strong>Adding/Removing Signers:</strong> Changes to the signer
                set require creating a proposal that must be approved by the
                current signers according to the threshold.
              </p>
              <p>
                <strong>Changing Threshold:</strong> The threshold can be
                adjusted but must always be between 1 and the total number of
                signers.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
