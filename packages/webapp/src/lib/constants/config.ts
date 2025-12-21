/**
 * Application configuration
 */
export const APP_CONFIG = {
  name: "Chameleon Money",
  description: "Private MultiSig Wallet on Aztec",
  version: "1.0.0",
} as const;

/**
 * Aztec network configuration
 */
export const AZTEC_CONFIG = {
  network: "devnet" as const,
  nodeUrl: "https://devnet.aztec-labs.com",
} as const;
