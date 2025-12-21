/**
 * Operation types from the MultiSig contract
 */
export const OPERATION_TYPES = {
  ADD_SIGNER: 1,
  REMOVE_SIGNER: 2,
  CHANGE_THRESHOLD: 3,
  EXECUTE_TRANSACTION: 4,
} as const;

export type OperationType =
  (typeof OPERATION_TYPES)[keyof typeof OPERATION_TYPES];

/**
 * Proposal status computed from on-chain data
 */
export type ProposalStatus = "pending" | "ready" | "executed" | "expired";

/**
 * Base proposal interface
 */
export interface Proposal {
  id: string;
  operationType: OperationType;
  proposer?: string; // Optional: may not be stored on-chain
  signatureCount: number;
  threshold: number; // Threshold at time of proposal
  executed: boolean;
  createdAt?: number; // Optional: may not be stored on-chain
  hasCurrentUserSigned?: boolean; // Computed client-side based on nullifier check

  // Type-specific fields (populated based on operationType)
  targetAddress?: string; // For ADD_SIGNER, REMOVE_SIGNER
  newThreshold?: number; // For CHANGE_THRESHOLD
  transactionToken?: string; // For EXECUTE_TRANSACTION
  transactionRecipient?: string; // For EXECUTE_TRANSACTION
  transactionAmount?: string; // For EXECUTE_TRANSACTION (as string to handle BigInt)
}

/**
 * Parameters for creating a transaction proposal
 */
export interface CreateTransactionProposal {
  type: "transaction";
  token: string; // EthAddress
  recipient: string; // EthAddress
  amount: bigint;
}

/**
 * Parameters for adding a signer
 */
export interface CreateAddSignerProposal {
  type: "add_signer";
  signerAddress: string; // AztecAddress
}

/**
 * Parameters for removing a signer
 */
export interface CreateRemoveSignerProposal {
  type: "remove_signer";
  signerAddress: string; // AztecAddress
}

/**
 * Parameters for changing threshold
 */
export interface CreateChangeThresholdProposal {
  type: "change_threshold";
  newThreshold: number;
}

/**
 * Union type for all proposal creation parameters
 */
export type CreateProposalParams =
  | CreateTransactionProposal
  | CreateAddSignerProposal
  | CreateRemoveSignerProposal
  | CreateChangeThresholdProposal;

/**
 * Helper to get operation type label
 */
export function getOperationTypeLabel(operationType: OperationType): string {
  switch (operationType) {
    case OPERATION_TYPES.ADD_SIGNER:
      return "Add Signer";
    case OPERATION_TYPES.REMOVE_SIGNER:
      return "Remove Signer";
    case OPERATION_TYPES.CHANGE_THRESHOLD:
      return "Change Threshold";
    case OPERATION_TYPES.EXECUTE_TRANSACTION:
      return "Execute Transaction";
    default:
      return "Unknown";
  }
}

/**
 * Helper to determine proposal status
 */
export function getProposalStatus(proposal: Proposal): ProposalStatus {
  if (proposal.executed) {
    return "executed";
  }

  if (proposal.signatureCount >= proposal.threshold) {
    return "ready";
  }

  // Note: We don't have expiry information from the contract
  // The contract has PROPOSAL_EXPIRY = 1000 blocks
  // but we can't easily check block numbers here
  return "pending";
}

/**
 * Helper to get status badge color
 */
export function getStatusColor(
  status: ProposalStatus,
): "default" | "success" | "warning" | "destructive" {
  switch (status) {
    case "executed":
      return "success";
    case "ready":
      return "warning";
    case "pending":
      return "default";
    case "expired":
      return "destructive";
  }
}
