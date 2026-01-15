# Chameleon Money

Private multi-signature treasury on Aztec with cross-chain payouts to EVM via Wormhole. This repo contains:

- A Noir MultiSig contract on Aztec that supports private signatures and threshold-based proposals.
- An EVM Treasury contract that verifies Wormhole VAAs and transfers tokens.
- A relayer that listens to Wormhole and forwards VAAs between Aztec and EVM.
- A Next.js webapp for managing proposals and signers.

## Packages

- `packages/aztec-contracts` — Noir MultiSig + Wormhole contract artifacts and scripts for deploying and operating the Aztec multisig.
- `packages/evm-contracts` — Solidity Treasury, Hardhat config and deploy script.
- `packages/relayer` — Go relayer that connects Wormhole Spy to Aztec PXE and Arbitrum RPC.
- `packages/webapp` — Next.js UI for proposals, settings, and wallet connect.

## Architecture (high level)

1. The Aztec `MultiSig` contract accepts proposals (add/remove signer, change threshold, execute transaction).
2. Signers privately sign proposals. When the threshold is met, anyone can execute.
3. Executing a transaction proposal publishes a Wormhole message from Aztec.
4. The relayer listens to Wormhole Spy, verifies the VAA, and forwards it:
   - Aztec -> EVM: sends a `verify` call to the Treasury contract.
   - EVM -> Aztec: uses a verification service (fallback to direct PXE).
5. The EVM Treasury verifies the VAA and transfers ERC20s to the recipient.

## Prerequisites

- Bun (workspace scripts and TypeScript execution)
- Go (relayer build/run)
- Aztec tooling (`aztec`, `aztec-nargo`) for compiling Noir contracts
- A Wormhole Spy endpoint and Wormhole contracts on the target chains

## Install

From the repo root:

```bash
bun install
```

## Aztec MultiSig workflow

### Compile and generate artifacts

```bash
bun --cwd packages/aztec-contracts run compile
bun --cwd packages/aztec-contracts run codegen
```

### Deploy signer accounts (optional)

```bash
bun --cwd packages/aztec-contracts run scripts/create_signers.ts
```

### Aztec environment variables

Create `.env` in `packages/aztec-contracts` from `.env.template` and update the signers

### Deploy the MultiSig contract

```bash
bun --cwd packages/aztec-contracts run scripts/deploy_multisig.ts
```

Update the multisig address in `.env`

### Create and execute a transaction proposal

```bash
bun --cwd packages/aztec-contracts run scripts/create_transaction.ts
```

## EVM Treasury contracts

### EVM environment variables

Create `.env` in `packages/evm-contracts` from `.env.template` and update the vars

Deploy to Arbitrum Sepolia (configured in `hardhat.config.ts`):

```bash
bunx --cwd packages/evm-contracts hardhat run scripts/deploy.ts --network arbitrum_sepolia
```

## Relayer

The relayer subscribes to Wormhole Spy and forwards VAAs to the correct target along with running the wormhole spy service.

### Relayer environment variables

Create `.env` in `packages/relayer` from `.env.template` and update the vars

### Run

```bash
bun --cwd packages/relayer run dev
```

## Webapp

### Webapp environment variables

Create `.env` in `packages/webapp` from `.env.template` and update the vars

### Run

```bash
bun --cwd packages/webapp run dev
```

Open `http://localhost:3000` to access the dashboard, proposals, and settings.
