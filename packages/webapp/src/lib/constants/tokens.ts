/**
 * ERC20 Token configuration
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
}

export const TOKENS: Record<string, TokenConfig> = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x9bcde216f5c24217db77a6e8ba9020a45ca69131",
    decimals: 18,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xd34c2594a7b3ef0b9445eccde1b8b04e5459fddc",
    decimals: 18,
  },
  DAI: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0xe42d1700d9c77a6c5e7d6ee774434d73b8308114",
    decimals: 18,
  },
} as const;

/**
 * Get token by address
 */
export function getTokenByAddress(address: string): TokenConfig | undefined {
  const normalizedAddress = address.toLowerCase();
  return Object.values(TOKENS).find(
    (token) => token.address.toLowerCase() === normalizedAddress,
  );
}

/**
 * List of all supported token addresses
 */
export const SUPPORTED_TOKEN_ADDRESSES = Object.values(TOKENS).map(
  (token) => token.address,
);
