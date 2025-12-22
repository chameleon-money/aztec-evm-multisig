import { AztecAddress, EthAddress } from "@aztec/aztec.js/addresses";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import type { Wallet } from "@aztec/aztec.js/wallet";
import { MultiSigContract } from "@chameleon_money/aztec-contracts/MultiSig";
import { TX_TIMEOUT } from "@/lib/constants/contracts";
import { validatePublicEnv } from "@/lib/env";
import type {
  CreateProposalParams,
  OperationType,
  Proposal,
} from "@/lib/types/proposal";
import { useRegularFees } from "./fee-payment";

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Check if it's a retriable error (IndexedDB transaction errors)
      const errorMessage = lastError.message.toLowerCase();
      const isRetriable =
        errorMessage.includes("transaction") ||
        errorMessage.includes("idbobjectstore") ||
        errorMessage.includes("indexeddb");

      if (!isRetriable) {
        throw lastError;
      }

      // Wait with exponential backoff
      const delay = baseDelay * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(
        `Retrying operation (attempt ${attempt + 2}/${maxRetries})...`,
      );
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * MultiSig Contract Service
 * Provides methods to interact with the MultiSig contract
 */
export class MultiSigService {
  private wallet: Wallet;
  private contract: MultiSigContract | null = null;
  private contractAddress: AztecAddress;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
    const env = validatePublicEnv();
    this.contractAddress = AztecAddress.fromString(env.multisigContractAddress);
  }

  /**
   * Initialize the contract instance
   */
  async initialize(): Promise<void> {
    try {
      const env = validatePublicEnv();
      const nodeClient = createAztecNodeClient(env.aztecNodeUrl);

      // Get contract instance from the node
      const instance = await nodeClient.getContract(this.contractAddress);

      if (!instance) {
        throw new Error(
          `Contract not found at address ${this.contractAddress}`,
        );
      }

      // Register contract with wallet
      await this.wallet.registerContract({
        instance,
        artifact: MultiSigContract.artifact,
      });

      // Get contract instance
      this.contract = await MultiSigContract.at(
        this.contractAddress,
        this.wallet,
      );

      console.log(
        "MultiSig contract initialized at:",
        this.contractAddress.toString(),
      );
    } catch (error) {
      console.error("Failed to initialize MultiSig contract:", error);
      throw new Error("Failed to connect to MultiSig contract");
    }
  }

  /**
   * Ensure contract is initialized
   */
  private async ensureContract(): Promise<MultiSigContract> {
    if (!this.contract) {
      await this.initialize();
    }
    return this.contract!;
  }

  /**
   * Get current user's address
   */
  private async getUserAddress(): Promise<AztecAddress> {
    const accounts = await this.wallet.getAccounts();
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found in wallet");
    }
    return accounts[0].item;
  }

  // ========== Proposal Creation Methods ==========

  /**
   * Create a transaction proposal
   */
  async proposeTransaction(
    token: string,
    recipient: string,
    amount: bigint,
  ): Promise<string> {
    const contract = await this.ensureContract();
    const from = await this.getUserAddress();

    // Get next proposal ID
    const nextId = await contract.methods.get_next_proposal_id().simulate({
      from,
      fee: {
        paymentMethod: useRegularFees(),
        maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
      },
    });

    // Create proposal
    const tx = await contract.methods
      .propose_execute_transaction(
        EthAddress.fromString(token),
        EthAddress.fromString(recipient),
        amount,
      )
      .send({
        from,
        fee: { paymentMethod: useRegularFees() },
      })
      .wait({ timeout: TX_TIMEOUT });

    console.log("Transaction proposal created:", tx.txHash.toString());
    return nextId.toString();
  }

  /**
   * Create a proposal to add a signer
   */
  async proposeAddSigner(signerAddress: string): Promise<string> {
    const contract = await this.ensureContract();
    const from = await this.getUserAddress();

    const nextId = await contract.methods.get_next_proposal_id().simulate({
      from,
      fee: {
        paymentMethod: useRegularFees(),
        maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
      },
    });

    const tx = await contract.methods
      .propose_add_signer(AztecAddress.fromString(signerAddress))
      .send({
        from,
        fee: { paymentMethod: useRegularFees() },
      })
      .wait({ timeout: TX_TIMEOUT });

    console.log("Add signer proposal created:", tx.txHash.toString());
    return nextId.toString();
  }

  /**
   * Create a proposal to remove a signer
   */
  async proposeRemoveSigner(signerAddress: string): Promise<string> {
    const contract = await this.ensureContract();
    const from = await this.getUserAddress();

    const nextId = await contract.methods.get_next_proposal_id().simulate({
      from,
      fee: {
        paymentMethod: useRegularFees(),
        maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
      },
    });

    const tx = await contract.methods
      .propose_remove_signer(AztecAddress.fromString(signerAddress))
      .send({
        from,
        fee: { paymentMethod: useRegularFees() },
      })
      .wait({ timeout: TX_TIMEOUT });

    console.log("Remove signer proposal created:", tx.txHash.toString());
    return nextId.toString();
  }

  /**
   * Create a proposal to change the threshold
   */
  async proposeChangeThreshold(newThreshold: number): Promise<string> {
    const contract = await this.ensureContract();
    const from = await this.getUserAddress();

    const nextId = await contract.methods.get_next_proposal_id().simulate({
      from,
      fee: {
        paymentMethod: useRegularFees(),
        maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
      },
    });

    const tx = await contract.methods
      .propose_change_threshold(newThreshold)
      .send({
        from,
        fee: { paymentMethod: useRegularFees() },
      })
      .wait({ timeout: TX_TIMEOUT });

    console.log("Change threshold proposal created:", tx.txHash.toString());
    return nextId.toString();
  }

  /**
   * Generic proposal creation method
   */
  async createProposal(params: CreateProposalParams): Promise<string> {
    switch (params.type) {
      case "transaction":
        return this.proposeTransaction(
          params.token,
          params.recipient,
          params.amount,
        );
      case "add_signer":
        return this.proposeAddSigner(params.signerAddress);
      case "remove_signer":
        return this.proposeRemoveSigner(params.signerAddress);
      case "change_threshold":
        return this.proposeChangeThreshold(params.newThreshold);
      default:
        throw new Error("Unknown proposal type");
    }
  }

  // ========== Proposal Action Methods ==========

  /**
   * Sign a proposal
   */
  async signProposal(proposalId: string): Promise<void> {
    const contract = await this.ensureContract();
    const from = await this.getUserAddress();

    const tx = await contract.methods
      .sign_proposal(BigInt(proposalId))
      .send({
        from,
        fee: { paymentMethod: useRegularFees() },
      })
      .wait({ timeout: TX_TIMEOUT });

    console.log("Proposal signed:", tx.txHash.toString());

    // Mark as signed in local storage for UI tracking
    await this.markAsSigned(proposalId);
  }

  /**
   * Execute a proposal
   */
  async executeProposal(proposalId: string): Promise<void> {
    const contract = await this.ensureContract();
    const from = await this.getUserAddress();

    const tx = await contract.methods
      .execute_proposal(BigInt(proposalId))
      .send({
        from,
        fee: { paymentMethod: useRegularFees() },
      })
      .wait({ timeout: TX_TIMEOUT });

    console.log("Proposal executed:", tx.txHash.toString());
  }

  // ========== View Methods ==========

  /**
   * Get current threshold
   */
  async getThreshold(): Promise<number> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const threshold = await contract.methods.get_threshold().simulate({
        from,
        fee: {
          paymentMethod: useRegularFees(),
          maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
        },
      });
      return Number(threshold);
    });
  }

  /**
   * Get total number of signers
   */
  async getSignerCount(): Promise<number> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const count = await contract.methods.get_signer_count().simulate({
        from,
        fee: {
          paymentMethod: useRegularFees(),
          maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
        },
      });
      return Number(count);
    });
  }

  /**
   * Check if an address is a signer
   */
  async isSigner(address: string): Promise<boolean> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const isSigner = await contract.methods
        .is_signer(AztecAddress.fromString(address))
        .simulate({
          from,
          fee: {
            paymentMethod: useRegularFees(),
            maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
          },
        });
      return Boolean(isSigner);
    });
  }

  /**
   * Get full proposal data from contract
   * Returns the complete Proposal struct with all fields
   */
  async getProposalFromContract(proposalId: string): Promise<{
    proposalId: bigint;
    operationType: number;
    proposer: string;
    targetAddress: string;
    newThreshold: number;
    transactionToken: string;
    transactionRecipient: string;
    transactionAmount: bigint;
    signatureCount: number;
    executed: boolean;
    createdAt: number;
  } | null> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const result = await contract.methods
        .get_proposal(BigInt(proposalId))
        .simulate({
          from,
          fee: {
            paymentMethod: useRegularFees(),
            maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
          },
        });

      // The result is a struct with fields in order:
      // proposal_id, operation_type, proposer, target_address, new_threshold,
      // transaction_token, transaction_recipient, transaction_amount,
      // signature_count, executed, created_at

      // Helper to convert EthAddress to string - handles various return formats
      const ethAddressToString = (addr: { inner: bigint }): string => {
        // Check for inner property (serialized struct)
        try {
          return EthAddress.fromNumber(addr.inner).toString();
        } catch {
          return `0x${addr.inner.toString(16).padStart(40, "0")}`;
        }
      };

      const proposal = {
        proposalId: result.proposal_id,
        operationType: Number(result.operation_type),
        proposer: result.proposer.toString(),
        targetAddress: result.target_address.toString(),
        newThreshold: Number(result.new_threshold),
        transactionToken: ethAddressToString(result.transaction_token),
        transactionRecipient: ethAddressToString(result.transaction_recipient),
        transactionAmount: result.transaction_amount,
        signatureCount: Number(result.signature_count),
        executed: Boolean(result.executed),
        createdAt: Number(result.created_at),
      };

      return proposal;
    });
  }

  /**
   * Get proposal operation type
   */
  async getProposalOperationType(proposalId: string): Promise<number> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const opType = await contract.methods
        .get_proposal_operation_type(BigInt(proposalId))
        .simulate({
          from,
          fee: {
            paymentMethod: useRegularFees(),
            maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
          },
        });
      return Number(opType);
    });
  }

  /**
   * Get proposal signature count
   */
  async getProposalSignatureCount(proposalId: string): Promise<number> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const count = await contract.methods
        .get_proposal_signature_count(BigInt(proposalId))
        .simulate({
          from,
          fee: {
            paymentMethod: useRegularFees(),
            maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
          },
        });
      return Number(count);
    });
  }

  /**
   * Check if proposal is executed
   */
  async getProposalExecuted(proposalId: string): Promise<boolean> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const executed = await contract.methods
        .get_proposal_executed(BigInt(proposalId))
        .simulate({
          from,
          fee: {
            paymentMethod: useRegularFees(),
            maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
          },
        });
      return Boolean(executed);
    });
  }

  /**
   * Get next proposal ID
   */
  async getNextProposalId(): Promise<number> {
    return retryWithBackoff(async () => {
      console.log("Getting next proposal ID...");
      const contract = await this.ensureContract();
      console.log("Contract:", contract);
      const from = await this.getUserAddress();
      console.log("Getting next proposal ID from:", from.toString());
      const nextId = await contract.methods.get_next_proposal_id().simulate({
        from,
        fee: {
          paymentMethod: useRegularFees(),
          maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
        },
      });
      console.log("Next proposal ID:", nextId.toString());
      return Number(nextId);
    });
  }

  /**
   * Get wormhole contract address
   */
  async getWormholeAddress(): Promise<string> {
    return retryWithBackoff(async () => {
      const contract = await this.ensureContract();
      const from = await this.getUserAddress();
      const address = await contract.methods.get_wormhole_address().simulate({
        from,
        fee: {
          paymentMethod: useRegularFees(),
          maxFeePerGas: { feePerL2Gas: 20000, feePerDaGas: 20000 },
        },
      });
      return address.toString();
    });
  }

  /**
   * Check if the current user has signed a proposal (client-side tracking)
   * Note: This uses localStorage to track signatures on this browser/device only.
   * The contract will still prevent double-signing via nullifiers even if this returns false.
   */
  async hasUserSigned(proposalId: string): Promise<boolean> {
    try {
      const from = await this.getUserAddress();
      const storageKey = `chameleon_signed_${from.toString()}_${proposalId}`;

      if (typeof window === "undefined") {
        return false;
      }

      return localStorage.getItem(storageKey) === "true";
    } catch (error) {
      console.error("Error checking signature status:", error);
      return false;
    }
  }

  /**
   * Mark a proposal as signed by the current user (client-side tracking)
   */
  async markAsSigned(proposalId: string): Promise<void> {
    try {
      const from = await this.getUserAddress();
      const storageKey = `chameleon_signed_${from.toString()}_${proposalId}`;

      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
      }
    } catch (error) {
      console.error("Error marking proposal as signed:", error);
    }
  }

  /**
   * Load a single proposal by ID
   */
  async loadProposal(proposalId: string): Promise<Proposal | null> {
    try {
      // Get full proposal data in a single call
      const contractProposal = await this.getProposalFromContract(proposalId);

      // If operation type is 0, proposal doesn't exist
      if (!contractProposal || contractProposal.operationType === 0) {
        return null;
      }

      // Get current threshold (needed for status calculation)
      const threshold = await this.getThreshold();

      const proposal: Proposal = {
        id: proposalId,
        operationType: contractProposal.operationType as OperationType,
        proposer: contractProposal.proposer,
        signatureCount: contractProposal.signatureCount,
        executed: contractProposal.executed,
        threshold,
        createdAt: contractProposal.createdAt,
        // Type-specific fields
        targetAddress: contractProposal.targetAddress,
        newThreshold: contractProposal.newThreshold,
        transactionToken: contractProposal.transactionToken,
        transactionRecipient: contractProposal.transactionRecipient,
        transactionAmount: contractProposal.transactionAmount.toString(),
      };

      return proposal;
    } catch (error) {
      console.error(`Failed to load proposal ${proposalId}:`, error);
      return null;
    }
  }

  /**
   * Load all proposals
   */
  async loadAllProposals(): Promise<Proposal[]> {
    const nextId = await this.getNextProposalId();
    const proposals: Proposal[] = [];

    // Load proposals sequentially to avoid IndexedDB transaction conflicts
    // Loading in parallel causes: "Failed to execute 'put' on 'IDBObjectStore': The transaction is not active"
    for (let i = 1; i < nextId; i++) {
      try {
        const proposal = await this.loadProposal(i.toString());
        if (proposal !== null) {
          proposals.push(proposal);
        }
      } catch (error) {
        console.error(`Failed to load proposal ${i}:`, error);
        // Continue loading other proposals even if one fails
      }
    }

    return proposals;
  }
}

/**
 * Create a MultiSig service instance
 */
export function createMultiSigService(wallet: Wallet): MultiSigService {
  return new MultiSigService(wallet);
}
