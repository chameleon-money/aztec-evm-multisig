"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useProposalStore } from "@/lib/stores/proposal-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import {
  Shield,
  PlusCircle,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { getProposalStatus } from "@/lib/types/proposal";

export default function ProposalsPage() {
  const { isConnected, wallet } = useWalletStore();
  const {
    proposals,
    isLoading,
    error,
    loadProposals,
    getPendingProposals,
    getExecutedProposals,
  } = useProposalStore();
  const [filter, setFilter] = useState<"all" | "pending" | "executed">("all");

  useEffect(() => {
    // Load proposals from the contract when wallet is connected
    if (isConnected && wallet) {
      loadProposals(wallet);
    }
  }, [isConnected, wallet, loadProposals]);

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
              Please connect your Azguard wallet to view proposals
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

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Proposals</h2>
            <p className="text-muted-foreground">
              View and manage all MultiSig proposals
            </p>
          </div>
          <Button asChild>
            <Link href="/proposals/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Proposal
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filter === "executed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("executed")}
              >
                Executed
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">
                Failed to load proposals
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
                Loading proposals...
              </p>
            </div>
          </div>
        )}

        {/* Proposals List */}
        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "all" && "All Proposals"}
                {filter === "pending" && "Pending Proposals"}
                {filter === "executed" && "Executed Proposals"}
              </CardTitle>
              <CardDescription>
                {filter === "all" &&
                  `Showing all ${proposals.length} proposals`}
                {filter === "pending" &&
                  `Showing ${getPendingProposals().length} pending proposals`}
                {filter === "executed" &&
                  `Showing ${getExecutedProposals().length} executed proposals`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filter proposals based on selected filter */}
                {(() => {
                  const filteredProposals =
                    filter === "pending"
                      ? getPendingProposals()
                      : filter === "executed"
                        ? getExecutedProposals()
                        : proposals;

                  if (filteredProposals.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Shield className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          No proposals yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create your first proposal to get started with the
                          MultiSig
                        </p>
                        <Button asChild>
                          <Link href="/proposals/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Proposal
                          </Link>
                        </Button>
                      </div>
                    );
                  }

                  return filteredProposals.map((proposal) => {
                    const status = getProposalStatus(proposal);
                    return (
                      <div
                        key={proposal.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">
                                Proposal #{proposal.id}
                              </h3>
                              {status === "executed" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3" />
                                  Executed
                                </span>
                              )}
                              {status === "ready" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <CheckCircle className="h-3 w-3" />
                                  Ready
                                </span>
                              )}
                              {status === "pending" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Operation Type: {proposal.operationType}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Signatures: {proposal.signatureCount} /{" "}
                              {proposal.threshold}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/proposals/${proposal.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
