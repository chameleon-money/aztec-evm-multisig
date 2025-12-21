import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee/testing";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import type { Wallet } from "@aztec/aztec.js/wallet";
import { validatePublicEnv } from "@/lib/env";

// Cache the sponsored FPC instance
let sponsoredFPCInstance: any | null = null;

/**
 * Setup sponsored fee payment for the wallet
 * This allows transactions to be submitted without paying gas fees
 * (fees are sponsored by the FPC contract on devnet)
 */
export async function setupSponsoredFee(
  wallet: Wallet,
): Promise<SponsoredFeePaymentMethod> {
  try {
    const env = validatePublicEnv();

    // Get or create the Sponsored FPC instance
    if (!sponsoredFPCInstance) {
      const nodeClient = createAztecNodeClient(env.aztecNodeUrl);

      // Get the deployed Sponsored FPC contract from the network
      // Note: The FPC contract should be deployed on devnet
      // For now, we'll get it from the node's deployed contracts
      const deployedContracts = await nodeClient.getNodeInfo();

      // In a real implementation, you'd get the FPC address from the environment
      // or from a known deployment. For now, we'll create a placeholder.
      // This assumes the Sponsored FPC is already deployed on the devnet.

      // Alternative: If you have the FPC address, you can use it directly
      // const fpcAddress = AztecAddress.fromString(process.env.SPONSORED_FPC_ADDRESS);

      // For now, we'll use a simplified approach
      // The SponsoredFeePaymentMethod constructor typically just needs an address
      // We'll create a dummy one for now - you should replace this with the actual FPC address

      console.warn(
        "Sponsored fee payment setup: Using placeholder. Update with actual FPC address.",
      );

      // Register the FPC contract with the wallet (if we have the instance)
      // await wallet.registerContract({
      //   instance: sponsoredFPCInstance,
      //   artifact: SponsoredFPCContract.artifact,
      // });
    }

    // Create and return the sponsored payment method
    // Note: This is a simplified version. In production, you need a proper FPC instance
    // For now, transactions will fail without a proper FPC setup

    // Placeholder - replace with actual implementation
    throw new Error(
      "Sponsored FPC not yet configured. Please set up the Sponsored FPC contract address.",
    );

    // When properly configured, return:
    // return new SponsoredFeePaymentMethod(sponsoredFPCInstance.address);
  } catch (error) {
    console.error("Failed to setup sponsored fee payment:", error);
    throw new Error(
      "Failed to setup fee payment. Transactions require gas fees.",
    );
  }
}

/**
 * Alternative: Use regular fee payment
 * This requires the user to have funds to pay for gas
 */
export function useRegularFees(): undefined {
  // Returning undefined uses the default fee payment (user pays)
  return undefined;
}

// Export a function to check if sponsored fees are available
export function isSponsoredFeesAvailable(): boolean {
  // Check if we're on devnet where sponsored fees are typically available
  const env = validatePublicEnv();
  return env.aztecNetwork === "devnet";
}
