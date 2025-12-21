import type { Wallet } from "@aztec/aztec.js/wallet";
import { create } from "zustand";
import { createMultiSigService } from "@/lib/contracts/multisig";
import type { MultiSigStats } from "@/lib/types/multisig";
import type { CreateProposalParams, Proposal } from "@/lib/types/proposal";
import { getProposalStatus } from "@/lib/types/proposal";

interface ProposalState {
  // State
  proposals: Proposal[];
  stats: MultiSigStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProposals: (wallet: Wallet) => Promise<void>;
  loadStats: (wallet: Wallet) => Promise<void>;
  createProposal: (
    wallet: Wallet,
    params: CreateProposalParams,
  ) => Promise<string>;
  signProposal: (wallet: Wallet, proposalId: string) => Promise<void>;
  executeProposal: (wallet: Wallet, proposalId: string) => Promise<void>;
  clearError: () => void;

  // Selectors
  getPendingProposals: () => Proposal[];
  getExecutedProposals: () => Proposal[];
  getProposal: (id: string) => Proposal | undefined;
}

export const useProposalStore = create<ProposalState>()((set, get) => ({
  // Initial state
  proposals: [],
  stats: null,
  isLoading: false,
  error: null,

  // Load all proposals from the contract
  loadProposals: async (wallet: Wallet) => {
    set({ isLoading: true, error: null });
    try {
      const service = createMultiSigService(wallet);
      await service.initialize();

      console.log("Loading proposals...");

      const proposals = await service.loadAllProposals();
      set({ proposals, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load proposals";
      set({ error: message, isLoading: false });
      console.error("Error loading proposals:", error);
    }
  },

  // Load MultiSig stats
  loadStats: async (wallet: Wallet) => {
    set({ isLoading: true, error: null });
    try {
      const service = createMultiSigService(wallet);
      await service.initialize();

      const [threshold, totalSigners, nextProposalId] = await Promise.all([
        service.getThreshold(),
        service.getSignerCount(),
        service.getNextProposalId(),
      ]);

      // Load proposals to calculate pending/executed counts
      const proposals = await service.loadAllProposals();

      const pendingProposals = proposals.filter(
        (p) => !p.executed && p.signatureCount < threshold,
      ).length;

      const executedProposals = proposals.filter((p) => p.executed).length;

      const stats: MultiSigStats = {
        threshold,
        totalSigners,
        pendingProposals,
        executedProposals,
        totalProposals: nextProposalId - 1, // nextId is 1-indexed
      };

      set({ stats, proposals, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load stats";
      set({ error: message, isLoading: false });
      console.error("Error loading stats:", error);
    }
  },

  // Create a new proposal
  createProposal: async (wallet: Wallet, params: CreateProposalParams) => {
    set({ isLoading: true, error: null });
    try {
      const service = createMultiSigService(wallet);
      await service.initialize();

      const proposalId = await service.createProposal(params);

      // Reload proposals after creating
      await get().loadProposals(wallet);

      set({ isLoading: false });
      return proposalId;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create proposal";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Sign a proposal
  signProposal: async (wallet: Wallet, proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const service = createMultiSigService(wallet);
      await service.initialize();

      await service.signProposal(proposalId);

      // Reload proposals after signing
      await get().loadProposals(wallet);

      set({ isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sign proposal";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Execute a proposal
  executeProposal: async (wallet: Wallet, proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      const service = createMultiSigService(wallet);
      await service.initialize();

      await service.executeProposal(proposalId);

      // Reload proposals after executing
      await get().loadProposals(wallet);

      set({ isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to execute proposal";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Get pending proposals
  getPendingProposals: () => {
    const { proposals, stats } = get();
    if (!stats) return [];
    return proposals.filter(
      (p) => !p.executed && p.signatureCount < stats.threshold,
    );
  },

  // Get executed proposals
  getExecutedProposals: () => {
    return get().proposals.filter((p) => p.executed);
  },

  // Get a specific proposal
  getProposal: (id: string) => {
    return get().proposals.find((p) => p.id === id);
  },
}));
