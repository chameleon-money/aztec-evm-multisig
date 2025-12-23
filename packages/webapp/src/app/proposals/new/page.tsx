"use client";

import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Send,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { getTokenByAddress, TOKENS } from "@/lib/constants/tokens";
import { useProposalStore } from "@/lib/stores/proposal-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import type { CreateProposalParams } from "@/lib/types/proposal";

type ProposalType =
  | "transaction"
  | "add_signer"
  | "remove_signer"
  | "change_threshold";

function NewProposalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, wallet } = useWalletStore();
  const { createProposal } = useProposalStore();

  const initialType =
    (searchParams.get("type") as ProposalType) || "transaction";
  const [proposalType, setProposalType] = useState<ProposalType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [token, setToken] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [signerAddress, setSignerAddress] = useState("");
  const [newThreshold, setNewThreshold] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet) {
      setError("Wallet not connected");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let params: CreateProposalParams;

      switch (proposalType) {
        case "transaction": {
          if (!token || !recipient || !amount) {
            throw new Error("All transaction fields are required");
          }
          const tokenInfo = getTokenByAddress(token);
          if (!tokenInfo) {
            throw new Error("Invalid token selected");
          }
          // Parse the human-readable amount and convert to smallest unit
          const parsedAmount = parseFloat(amount);
          if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error("Amount must be a positive number");
          }
          // Convert to smallest unit (multiply by 10^decimals)
          const multiplier = BigInt(10 ** tokenInfo.decimals);
          // Handle decimal amounts by splitting into whole and fractional parts
          const [wholePart, fractionalPart = ""] = amount.split(".");
          const paddedFractional = fractionalPart
            .padEnd(tokenInfo.decimals, "0")
            .slice(0, tokenInfo.decimals);
          const amountInSmallestUnit =
            BigInt(wholePart || "0") * multiplier +
            BigInt(paddedFractional || "0");

          params = {
            type: "transaction",
            token,
            recipient,
            amount: amountInSmallestUnit,
          };
          break;
        }

        case "add_signer":
          if (!signerAddress) {
            throw new Error("Signer address is required");
          }
          params = {
            type: "add_signer",
            signerAddress,
          };
          break;

        case "remove_signer":
          if (!signerAddress) {
            throw new Error("Signer address is required");
          }
          params = {
            type: "remove_signer",
            signerAddress,
          };
          break;

        case "change_threshold": {
          if (!newThreshold) {
            throw new Error("New threshold is required");
          }
          const thresholdNum = parseInt(newThreshold, 10);
          if (isNaN(thresholdNum) || thresholdNum < 1) {
            throw new Error("Threshold must be a positive number");
          }
          params = {
            type: "change_threshold",
            newThreshold: thresholdNum,
          };
          break;
        }

        default:
          throw new Error("Invalid proposal type");
      }

      const proposalId = await createProposal(wallet, params);

      // Redirect to the proposal detail page
      router.push(`/proposals/${proposalId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create proposal";
      setError(message);
      console.error("Error creating proposal:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Please connect your Azguard wallet to create a proposal
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
                className="text-sm font-medium text-primary"
              >
                Proposals
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium hover:text-primary"
              >
                Settings
              </Link>
            </nav>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/proposals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Create New Proposal</h2>
          <p className="text-muted-foreground">
            Submit a proposal for MultiSig approval
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">Error</h4>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Proposal Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Proposal Type</CardTitle>
              <CardDescription>
                Select what kind of proposal you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProposalType("transaction")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    proposalType === "transaction"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Send
                      className={`h-5 w-5 mt-0.5 ${proposalType === "transaction" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div
                        className={`font-medium ${proposalType === "transaction" ? "text-primary" : ""}`}
                      >
                        Execute Transaction
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Send tokens via Wormhole
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalType("add_signer")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    proposalType === "add_signer"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Users
                      className={`h-5 w-5 mt-0.5 ${proposalType === "add_signer" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div
                        className={`font-medium ${proposalType === "add_signer" ? "text-primary" : ""}`}
                      >
                        Add Signer
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Add new authorized signer
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalType("remove_signer")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    proposalType === "remove_signer"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Users
                      className={`h-5 w-5 mt-0.5 ${proposalType === "remove_signer" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div
                        className={`font-medium ${proposalType === "remove_signer" ? "text-primary" : ""}`}
                      >
                        Remove Signer
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Remove existing signer
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProposalType("change_threshold")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    proposalType === "change_threshold"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Settings2
                      className={`h-5 w-5 mt-0.5 ${proposalType === "change_threshold" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div>
                      <div
                        className={`font-medium ${proposalType === "change_threshold" ? "text-primary" : ""}`}
                      >
                        Change Threshold
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Update signature requirement
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Form */}
          {proposalType === "transaction" && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>
                  Specify the token transfer details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="token"
                    className="block text-sm font-medium mb-2"
                  >
                    Token
                  </label>
                  <Select value={token} onValueChange={setToken}>
                    <SelectTrigger id="token">
                      <SelectValue placeholder="Select a token" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TOKENS).map((t) => (
                        <SelectItem key={t.address} value={t.address}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{t.symbol}</span>
                            <span className="text-muted-foreground">
                              - {t.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the token to transfer
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="recipient"
                    className="block text-sm font-medium mb-2"
                  >
                    Recipient Address
                  </label>
                  <input
                    id="recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Destination address on target chain
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium mb-2"
                  >
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => {
                        // Allow only valid decimal number input
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setAmount(value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                    {token && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        {getTokenByAddress(token)?.symbol}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the amount in{" "}
                    {token ? getTokenByAddress(token)?.symbol : "tokens"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Signer Form */}
          {proposalType === "add_signer" && (
            <Card>
              <CardHeader>
                <CardTitle>Add Signer</CardTitle>
                <CardDescription>
                  Specify the address to add as a signer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label
                    htmlFor="signerAddress"
                    className="block text-sm font-medium mb-2"
                  >
                    Signer Address
                  </label>
                  <input
                    id="signerAddress"
                    type="text"
                    value={signerAddress}
                    onChange={(e) => setSignerAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Aztec address of the new signer
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remove Signer Form */}
          {proposalType === "remove_signer" && (
            <Card>
              <CardHeader>
                <CardTitle>Remove Signer</CardTitle>
                <CardDescription>
                  Specify the address to remove from signers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label
                    htmlFor="signerAddress"
                    className="block text-sm font-medium mb-2"
                  >
                    Signer Address
                  </label>
                  <input
                    id="signerAddress"
                    type="text"
                    value={signerAddress}
                    onChange={(e) => setSignerAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Aztec address of the signer to remove
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Change Threshold Form */}
          {proposalType === "change_threshold" && (
            <Card>
              <CardHeader>
                <CardTitle>Change Threshold</CardTitle>
                <CardDescription>
                  Set the new signature requirement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label
                    htmlFor="newThreshold"
                    className="block text-sm font-medium mb-2"
                  >
                    New Threshold
                  </label>
                  <input
                    id="newThreshold"
                    type="number"
                    min="1"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of signatures required (must not exceed total
                    signers)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/proposals")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewProposalForm />
    </Suspense>
  );
}
