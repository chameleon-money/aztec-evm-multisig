import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee/testing";
import { Fr, GrumpkinScalar } from "@aztec/aztec.js/fields";
import { createLogger } from "@aztec/aztec.js/log";
import type { AccountManager } from "@aztec/aztec.js/wallet";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { AztecAddress } from "@aztec/stdlib/aztec-address";
import type { TestWallet } from "@aztec/test-wallet/server";
import { getSponsoredFPCInstance } from "./sponsored_fpc.js";

export async function deploySchnorrAccount(wallet: TestWallet): Promise<AccountManager> {
    const logger = createLogger('aztec:aztec-starter');
    logger.info('👤 Starting Schnorr account deployment...');

    // Generate account keys
    logger.info('🔐 Generating account keys...');
    const secretKey = Fr.random();
    const signingKey = GrumpkinScalar.random();
    const salt = Fr.random();
    logger.info(`Save the following SECRET and SALT in .env for future use.`);
    logger.info(`🔑 Secret key generated: ${secretKey.toString()}`);
    logger.info(`🖊️ Signing key generated: ${signingKey.toString()}`);
    logger.info(`🧂 Salt generated: ${salt.toString()}`);

    const account = await wallet.createSchnorrAccount(secretKey, salt, signingKey)
    logger.info(`📍 Account address will be: ${account.address}`);

    const deployMethod = await account.getDeployMethod();

    // Setup sponsored FPC
    logger.info('💰 Setting up sponsored fee payment for account deployment...');
    const sponsoredFPC = await getSponsoredFPCInstance();
    logger.info(`💰 Sponsored FPC instance obtained at: ${sponsoredFPC.address}`);

    logger.info('📝 Registering sponsored FPC contract with PXE...');
    await wallet.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
    const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);
    logger.info('✅ Sponsored fee payment method configured for account deployment');

    // Deploy account
    const tx = await deployMethod.send({ from: AztecAddress.ZERO, fee: { paymentMethod: sponsoredPaymentMethod } }).wait({ timeout: 120000 });

    logger.info(`✅ Account deployment transaction successful!`);
    logger.info(`📋 Transaction hash: ${tx.txHash}`);

    return account;
}