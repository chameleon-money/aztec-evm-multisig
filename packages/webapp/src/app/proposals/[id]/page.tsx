"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Play,
  Send,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { useProposalStore } from "@/lib/stores/proposal-store";
import { useWalletStore } from "@/lib/stores/wallet-store";
import type { Proposal } from "@/lib/types/proposal";
import { getProposalStatus } from "@/lib/types/proposal";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected, wallet } = useWalletStore();
  const {
    proposals,
    isLoading,
    error,
    loadProposals,
    signProposal,
    executeProposal,
    getProposal,
  } = useProposalStore();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isSigningOrExecuting, setIsSigningOrExecuting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [hasUserSigned, setHasUserSigned] = useState(false);
  const [checkingSignature, setCheckingSignature] = useState(false);

  const proposalId = params.id as string;

  useEffect(() => {
    if (isConnected && wallet) {
      loadProposals(wallet);
    }
  }, [isConnected, wallet, loadProposals]);

  useEffect(() => {
    if (proposalId && proposals.length > 0) {
      const found = getProposal(proposalId);
      setProposal(found || null);
    }
  }, [proposalId, proposals, getProposal]);

  // Check if current user has signed this proposal
  useEffect(() => {
    async function checkSignatureStatus() {
      if (!wallet || !proposalId || !proposal || proposal.executed) {
        setHasUserSigned(false);
        return;
      }

      setCheckingSignature(true);
      try {
        const service = createMultiSigService(wallet);
        await service.initialize();
        const hasSigned = await service.hasUserSigned(proposalId);
        setHasUserSigned(hasSigned);
      } catch (err) {
        console.error("Error checking signature status:", err);
        setHasUserSigned(false);
      } finally {
        setCheckingSignature(false);
      }
    }

    checkSignatureStatus();
  }, [wallet, proposalId, proposal]);

  const handleSign = async () => {
    if (!wallet || !proposalId) return;

    setIsSigningOrExecuting(true);
    setActionError(null);

    try {
      await signProposal(wallet, proposalId);
      // Proposal will be reloaded automatically by the store
      // Update signature status
      setHasUserSigned(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sign proposal";
      setActionError(message);
      console.error("Error signing proposal:", err);
    } finally {
      setIsSigningOrExecuting(false);
    }
  };

  const handleExecute = async () => {
    if (!wallet || !proposalId) return;

    setIsSigningOrExecuting(true);
    setActionError(null);

    try {
      await executeProposal(wallet, proposalId);
      // Proposal will be reloaded automatically by the store
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to execute proposal";
      setActionError(message);
      console.error("Error executing proposal:", err);
    } finally {
      setIsSigningOrExecuting(false);
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
              Please connect your Azguard wallet to view proposal details
            </p>
            <WalletConnectButton />
          </div>
        </main>
      </div>
    );
  }

  const status = proposal ? getProposalStatus(proposal) : null;
  const canSign =
    proposal && !proposal.executed && status === "pending" && !hasUserSigned;
  const canExecute = proposal && !proposal.executed && status === "ready";

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/proposals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Link>
        </Button>

        {/* Error Alert */}
        {(error || actionError) && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive">Error</h4>
              <p className="text-sm text-destructive/80 mt-1">
                {error || actionError}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !proposal && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading proposal details...
              </p>
            </div>
          </div>
        )}

        {/* Proposal Not Found */}
        {!isLoading && !proposal && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Proposal Not Found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The proposal with ID {proposalId} could not be found.
                </p>
                <Button asChild>
                  <Link href="/proposals">Back to Proposals</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposal Details */}
        {proposal && (
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      Proposal #{proposal.id}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {status === "executed" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          Executed
                        </span>
                      )}
                      {status === "ready" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="h-4 w-4" />
                          Ready to Execute
                        </span>
                      )}
                      {status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-4 w-4" />
                          Pending Signatures
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {proposal.operationType === 1 && (
                      <Send className="h-6 w-6 text-primary" />
                    )}
                    {proposal.operationType === 2 && (
                      <Users className="h-6 w-6 text-primary" />
                    )}
                    {proposal.operationType === 3 && (
                      <Users className="h-6 w-6 text-primary" />
                    )}
                    {proposal.operationType === 4 && (
                      <Settings2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>
                  Information about this proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Operation Type
                    </div>
                    <div className="text-sm">
                      {proposal.operationType === 1 && "Execute Transaction"}
                      {proposal.operationType === 2 && "Add Signer"}
                      {proposal.operationType === 3 && "Remove Signer"}
                      {proposal.operationType === 4 && "Change Threshold"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Status
                    </div>
                    <div className="text-sm capitalize">
                      {status || "Unknown"}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Signatures
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min(100, (proposal.signatureCount / proposal.threshold) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {proposal.signatureCount} / {proposal.threshold}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {proposal.threshold - proposal.signatureCount > 0
                      ? `${proposal.threshold - proposal.signatureCount} more signature${proposal.threshold - proposal.signatureCount !== 1 ? "s" : ""} needed`
                      : "All required signatures collected"}
                  </p>
                </div>

                {/* User Signature Status */}
                {!proposal.executed && (
                  <div className="border-t pt-4">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Your Signature
                    </div>
                    {checkingSignature ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking signature status...
                      </div>
                    ) : hasUserSigned ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCheck className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          You have signed this proposal
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          You have not signed this proposal yet
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Sign or execute this proposal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Show sign button if user hasn't signed */}
                {canSign && (
                  <Button
                    className="w-full"
                    onClick={handleSign}
                    disabled={isSigningOrExecuting}
                  >
                    {isSigningOrExecuting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Sign Proposal
                      </>
                    )}
                  </Button>
                )}

                {/* Show message if user has already signed but proposal is still pending */}
                {hasUserSigned &&
                  !proposal.executed &&
                  status === "pending" && (
                    <div className="text-center py-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">
                        You've already signed this proposal
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        Waiting for{" "}
                        {proposal.threshold - proposal.signatureCount} more
                        signature
                        {proposal.threshold - proposal.signatureCount !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  )}

                {canExecute && (
                  <Button
                    className="w-full"
                    onClick={handleExecute}
                    disabled={isSigningOrExecuting}
                  >
                    {isSigningOrExecuting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Execute Proposal
                      </>
                    )}
                  </Button>
                )}

                {proposal.executed && (
                  <div className="text-center py-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">
                      This proposal has been executed
                    </p>
                  </div>
                )}

                {!canSign && !canExecute && !proposal.executed && (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Waiting for more signatures before execution
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>About This Proposal</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Signing:</strong> Each authorized signer can sign this
                  proposal once. Signatures are private and recorded on-chain.
                </p>
                <p>
                  <strong>Execution:</strong> Once the proposal has collected
                  enough signatures ({proposal.threshold} required), anyone can
                  execute it to trigger the proposed action.
                </p>
                <p>
                  <strong>Privacy:</strong> All signature verification happens
                  privately using Aztec's private state. Only the signature
                  count is publicly visible.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
