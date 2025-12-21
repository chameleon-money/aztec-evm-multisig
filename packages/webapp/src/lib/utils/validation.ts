import { z } from "zod";

/**
 * Validate an Aztec address (hex string starting with 0x)
 */
export const aztecAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Aztec address format");

/**
 * Validate an Ethereum address (hex string starting with 0x, 40 chars)
 */
export const ethAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format");

/**
 * Validate a proposal threshold (must be >= 1)
 */
export const thresholdSchema = z
  .number()
  .int()
  .min(1, "Threshold must be at least 1");

/**
 * Validate a BigInt amount string
 */
export const amountSchema = z.string().refine(
  (val) => {
    try {
      const num = BigInt(val);
      return num > 0n;
    } catch {
      return false;
    }
  },
  { message: "Invalid amount" },
);

/**
 * Schema for creating a transaction proposal
 */
export const createTransactionProposalSchema = z.object({
  token: ethAddressSchema,
  recipient: ethAddressSchema,
  amount: z.string().min(1, "Amount is required"),
});

/**
 * Schema for adding a signer
 */
export const addSignerProposalSchema = z.object({
  signerAddress: aztecAddressSchema,
});

/**
 * Schema for removing a signer
 */
export const removeSignerProposalSchema = z.object({
  signerAddress: aztecAddressSchema,
});

/**
 * Schema for changing threshold
 */
export const changeThresholdProposalSchema = z.object({
  newThreshold: thresholdSchema,
});

/**
 * Type guards
 */
export function isAztecAddress(value: string): boolean {
  return aztecAddressSchema.safeParse(value).success;
}

export function isEthAddress(value: string): boolean {
  return ethAddressSchema.safeParse(value).success;
}
