"use client";

import { useEffect } from "react";
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
  Users,
  FileText,
  CheckCircle,
  Clock,
  PlusCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { isConnected, wallet } = useWalletStore();
  const { stats, isLoading, error, loadStats } = useProposalStore();

  useEffect(() => {
    // Load stats from the contract when wallet is connected
    if (isConnected && wallet) {
      loadStats(wallet);
    }
  }, [isConnected, wallet, loadStats]);

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
              Please connect your Azguard wallet to access the dashboard
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
                className="text-sm font-medium text-primary"
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's your MultiSig overview.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">
                Failed to load contract data
              </h4>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !stats && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading contract data...
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Signature Threshold
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.threshold} of {stats.totalSigners}
                </div>
                <p className="text-xs text-muted-foreground">
                  Signatures required
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Signers
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSigners}</div>
                <p className="text-xs text-muted-foreground">Active signers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Proposals
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingProposals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting signatures
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Executed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.executedProposals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed proposals
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you can perform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/proposals/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Proposal
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/proposals">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Proposals
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/settings">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Signers
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest proposals and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity. Create your first proposal to get started!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to use Chameleon Money</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Create a Proposal</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to "Create New Proposal" to start a new transaction,
                add/remove signers, or change the threshold.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Collect Signatures</h4>
              <p className="text-sm text-muted-foreground">
                Share the proposal with other signers. Each signer can sign it
                privately.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Execute When Ready</h4>
              <p className="text-sm text-muted-foreground">
                Once the threshold is met, anyone can execute the proposal to
                trigger the action.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
