import Link from "next/link";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Lock, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Chameleon Money</h1>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">
              Private MultiSig Wallet on Aztec
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Secure, private, and collaborative asset management with
              multi-signature governance on the Aztec network
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/proposals">View Proposals</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Multi-Signature</CardTitle>
              <CardDescription>
                Require multiple signatures for transaction approval
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Private Transactions</CardTitle>
              <CardDescription>
                Built on Aztec for maximum privacy and confidentiality
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Flexible Governance</CardTitle>
              <CardDescription>
                Add/remove signers and adjust threshold dynamically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Cross-Chain Bridge</CardTitle>
              <CardDescription>
                Execute transactions across chains via Wormhole
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Create Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Any signer can create proposals for transactions,
                  adding/removing signers, or changing the signature threshold.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Collect Signatures</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Signers privately sign proposals. Once the threshold is met,
                  the proposal is ready for execution.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Execute Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Approved proposals can be executed by anyone, triggering the
                  action on-chain with full privacy guarantees.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription>
                Connect your Azguard wallet to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletConnectButton />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Built on Aztec • Powered by Privacy</p>
        </div>
      </footer>
    </div>
  );
}
