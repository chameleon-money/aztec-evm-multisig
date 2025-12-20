import type { AztecNode } from "@aztec/aztec.js/node";
import { TokenContractArtifact } from "@aztec/noir-contracts.js/Token";
import { AztecAddress } from "@aztec/stdlib/aztec-address";
import type { TestWallet } from "@aztec/test-wallet/server";
import { WormholeContract } from "../../artifacts/Wormhole";

export async function registerWormholeContracts(
  nodeClient: AztecNode,
  wallet: TestWallet,
) {
  const wormholeAddressStr = process.env.WORMHOLE_CONTRACT_ADDRESS;
  const wormholeTokenAddressStr = process.env.WORMHOLE_TOKEN_CONTRACT_ADDRESS;

  if (!wormholeAddressStr || !wormholeTokenAddressStr) {
    throw new Error(
      `WORMHOLE_CONTRACT_ADDRESS and WORMHOLE_TOKEN_CONTRACT_ADDRESS environment variables are required. Please set them in your .env file.`,
    );
  }

  const wormholeAddress = AztecAddress.fromString(wormholeAddressStr);
  const wormholeTokenAddress = AztecAddress.fromString(wormholeTokenAddressStr);
  const wormholeInstance = await nodeClient.getContract(wormholeAddress);
  const wormholeTokenInstance =
    await nodeClient.getContract(wormholeTokenAddress);

  if (!wormholeInstance) {
    throw new Error(
      `Wormhole contract instance not found at address ${wormholeAddress}`,
    );
  }

  if (!wormholeTokenInstance) {
    throw new Error(
      `Wormhole token contract instance not found at address ${wormholeTokenAddress}`,
    );
  }

  await wallet.registerContract({
    instance: wormholeInstance,
    artifact: WormholeContract.artifact,
  });
  await wallet.registerContract({
    instance: wormholeTokenInstance,
    artifact: TokenContractArtifact,
  });

  return {
    wormholeInstance,
    wormholeTokenInstance,
    wormholeAddress,
    wormholeTokenAddress,
  };
}
