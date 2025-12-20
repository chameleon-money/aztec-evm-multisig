import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { TestWallet } from "@aztec/test-wallet/server";

import { getAccountFromEnv } from "./utils/create_account_from_env";
import { deploySchnorrAccount } from "./utils/deploy_account";
import { getSponsoredFPCInstance } from "./utils/sponsored_fpc";

export function getTimeouts() {
  return {
    deployTimeout: 1200000, // 20 minutes
    txTimeout: 180000,     // 3 minutes
    waitTimeout: 60000     // 1 minute
  };
}

export const sponsoredFPC = await getSponsoredFPCInstance();

const AZTEC_NODE_URL = "https://devnet.aztec-labs.com";
export const nodeClient = createAztecNodeClient(AZTEC_NODE_URL);
export const wallet = await TestWallet.create(nodeClient);

export const signer1 = await getAccountFromEnv(1, wallet);
export const signer2 = await getAccountFromEnv(2, wallet);
export const signer3 = await getAccountFromEnv(3, wallet);

export function deploySigners() {
  return Promise.all([
    deploySchnorrAccount(wallet),
    deploySchnorrAccount(wallet),
    deploySchnorrAccount(wallet)
  ]);
}
