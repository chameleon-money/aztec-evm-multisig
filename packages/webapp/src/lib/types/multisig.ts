/**
 * MultiSig configuration
 */
export interface MultiSigConfig {
  threshold: number;
  signerCount: number;
  signers: string[]; // AztecAddress[]
  wormholeAddress: string; // AztecAddress
}

/**
 * Signer information
 */
export interface SignerInfo {
  address: string;
  isCurrentUser: boolean;
}

/**
 * MultiSig stats for dashboard
 */
export interface MultiSigStats {
  threshold: number;
  totalSigners: number;
  pendingProposals: number;
  executedProposals: number;
  totalProposals: number;
}
