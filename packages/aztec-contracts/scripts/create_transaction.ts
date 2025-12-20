import { EthAddress } from "@aztec/aztec.js/addresses";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee/testing";
import { createLogger } from "@aztec/aztec.js/log";
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { AztecAddress } from "@aztec/stdlib/aztec-address";
import { parseEther } from "viem";
import { MultiSigContract } from "../artifacts/MultiSig.js";
import {
  getTimeouts,
  signer1,
  signer2,
  signer3,
  sponsoredFPC,
  wallet,
} from "./config.js";

async function main() {
  const logger = createLogger("aztec:multisig-operations-existing");

  const timeouts = getTimeouts();

  // Setup sponsored fee payment
  await wallet.registerContract({
    instance: sponsoredFPC,
    artifact: SponsoredFPCContract.artifact,
  });
  const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(
    sponsoredFPC.address,
  );

  // Connect to existing pod racing contract (replace with your deployed contract address)
  const contractAddress = process.env.MULTISIG_CONTRACT_ADDRESS;
  if (!contractAddress) {
    logger.error(
      "Please set MULTISIG_CONTRACT_ADDRESS environment variable with your deployed contract address",
    );
    return;
  }

  logger.info(`Connecting to MultiSig contract at: ${contractAddress}`);

  // Reconstruct contract instance
  const multisigContractAddress = AztecAddress.fromString(contractAddress);

  const nodeClient = createAztecNodeClient("https://devnet.aztec-labs.com");
  const multisigInstance = await nodeClient.getContract(
    multisigContractAddress,
  );

  if (!multisigInstance) {
    throw new Error(
      `MultiSig contract instance not found at address ${multisigContractAddress}`,
    );
  }

  await wallet.registerContract({
    instance: multisigInstance,
    artifact: MultiSigContract.artifact,
  });

  // Get the contract instance from the PXE
  const multisigContract = await MultiSigContract.at(
    multisigContractAddress,
    wallet,
  );

  const tokenAddress = EthAddress.fromString(
    "0x4a9088e41c625d13200a12a5952c0f9dbca9abfc",
  );
  const receipientAddress = EthAddress.fromString(
    "0x7e1b5dbb3cddc33b22b70d1890a5ba11a35d8921",
  );
  const amount = parseEther("50"); // 1 ether in wei (as bigint)

  const nextProposalId = await multisigContract.methods
    .get_next_proposal_id()
    .simulate({ from: signer1.address });

  console.log(nextProposalId);
  const proposeTx = await multisigContract.methods
    .propose_execute_transaction(tokenAddress, receipientAddress, amount)
    .send({
      from: signer1.address,
      fee: { paymentMethod: sponsoredPaymentMethod },
    })
    .wait({ timeout: timeouts.txTimeout });

  console.log(`The proposal transaction hash is: ${proposeTx.txHash}`);

  // Sign the proposal from the first signer
  const sign1Tx = await multisigContract.methods
    .sign_proposal(nextProposalId)
    .send({
      from: signer1.address,
      fee: { paymentMethod: sponsoredPaymentMethod },
    })
    .wait({ timeout: timeouts.txTimeout });

  console.log(`The sign transaction hash is: ${sign1Tx.txHash}`);

  // Sign the proposal from the second signer
  const sign2Tx = await multisigContract.methods
    .sign_proposal(nextProposalId)
    .send({
      from: signer2.address,
      fee: { paymentMethod: sponsoredPaymentMethod },
    })
    .wait({ timeout: timeouts.txTimeout });

  console.log(`The sign transaction hash is: ${sign2Tx.txHash}`);

  // Sign the proposal from the third signer
  const sign3Tx = await multisigContract.methods
    .sign_proposal(nextProposalId)
    .send({
      from: signer3.address,
      fee: { paymentMethod: sponsoredPaymentMethod },
    })
    .wait({ timeout: timeouts.txTimeout });

  console.log(`The sign transaction hash is: ${sign3Tx.txHash}`);

  // Execute the proposal
  const executeTx = await multisigContract.methods
    .execute_proposal(nextProposalId)
    .send({
      from: signer1.address,
      fee: { paymentMethod: sponsoredPaymentMethod },
    })
    .wait({ timeout: timeouts.txTimeout });

  console.log(`The execute transaction hash is: ${executeTx.txHash}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
