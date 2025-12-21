import { z } from "zod";

// Schema for public environment variables (available on client and server)
const publicEnvSchema = z.object({
  treasuryContractAddress: z.string(),
  multisigContractAddress: z.string(),
  aztecNodeUrl: z.string().url().default("https://devnet.aztec-labs.com"),
  aztecNetwork: z.enum(["devnet", "testnet", "mainnet"]).default("devnet"),
});

// Schema for server-only environment variables (not exposed to the client)
const serverEnvSchema = z.object({});

// Create types from the schemas
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Combined type for all environment variables
export type ValidatedEnv = PublicEnv;

/**
 * Validates public environment variables that are safe to use on the client
 * @returns The validated public environment variables
 */
export function validatePublicEnv(): PublicEnv {
  const env = {
    treasuryContractAddress: process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS,
    multisigContractAddress: process.env.NEXT_PUBLIC_MULTISIG_CONTRACT_ADDRESS,
    aztecNodeUrl: process.env.NEXT_PUBLIC_AZTEC_NODE_URL,
    aztecNetwork: process.env.NEXT_PUBLIC_AZTEC_NETWORK,
  };

  try {
    return publicEnvSchema.parse(env);
  } catch (error) {
    handleValidationError(error);
  }
}

/**
 * Validates all environment variables (both public and server-only)
 * This should ONLY be used in server contexts
 * @returns The validated environment variables
 */
export function validateEnv(): ValidatedEnv {
  // First validate public env vars
  const publicEnv = validatePublicEnv();

  // Then validate server-only env vars
  const serverEnv = {};

  try {
    const validatedServerEnv = serverEnvSchema.parse(serverEnv);
    return { ...publicEnv, ...validatedServerEnv };
  } catch (error) {
    handleValidationError(error);
  }
}

/**
 * Helper function to handle validation errors
 */
function handleValidationError(error: unknown): never {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues
      .map((err) => {
        const path = err.path.join(".");
        return `  - ${path}: ${err.message}`;
      })
      .join("\n");

    throw new Error(
      `Environment variable validation failed:\n${missingVars}\n\nPlease check your .env.local file and make sure all required variables are set correctly.`,
    );
  }

  // Re-throw other errors
  throw error;
}
