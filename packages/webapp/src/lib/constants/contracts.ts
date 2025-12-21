/**
 * MultiSig contract operation types
 * These must match the values in the MultiSig contract
 */
export const OPERATION_TYPES = {
  ADD_SIGNER: 1,
  REMOVE_SIGNER: 2,
  CHANGE_THRESHOLD: 3,
  EXECUTE_TRANSACTION: 4,
} as const;

/**
 * Proposal expiry (in blocks)
 * From the contract: PROPOSAL_EXPIRY = 1000
 */
export const PROPOSAL_EXPIRY_BLOCKS = 1000;

/**
 * Maximum number of signers allowed
 * From the contract: MAX_SIGNERS = 20
 */
export const MAX_SIGNERS = 20;

/**
 * Transaction timeouts (in milliseconds)
 */
export const TX_TIMEOUT = 120000; // 2 minutes
