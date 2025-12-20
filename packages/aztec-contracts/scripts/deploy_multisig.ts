import { AztecAddress } from "@aztec/aztec.js/addresses";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee/testing";
import { createLogger } from "@aztec/aztec.js/log";
import { SponsoredFPCContract } from "@aztec/noir-contracts.js/SponsoredFPC";
import { MultiSigContract } from "../artifacts/MultiSig.js"
import { getTimeouts, nodeClient, signer1, signer2, signer3, sponsoredFPC, wallet } from "./config.js";
import { registerWormholeContracts } from "./utils/register_wormhole_contracts.js";

async function main() {
    const logger = createLogger('aztec:multisig-deploy');
    logger.info(`🚀 Starting MultiSig contract deployment process...`);

    const timeouts = getTimeouts();

    logger.info('📝 Registering sponsored FPC contract with wallet...');
    await wallet.registerContract({ instance: sponsoredFPC, artifact: SponsoredFPCContract.artifact });
    const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(sponsoredFPC.address);
    logger.info('✅ Sponsored fee payment method configured');

    // Prepare initial signers array (max 20 signers, but we'll only use first 3)
    const initialSigners: AztecAddress[] = [];

    // Add our 3 signers
    initialSigners.push(signer1.address);
    initialSigners.push(signer2.address);
    initialSigners.push(signer3.address);

    // Fill the rest with zero addresses to reach MAX_SIGNERS (20)
    for (let i = 3; i < 20; i++) {
        initialSigners.push(AztecAddress.ZERO);
    }

    const initialSignerCount = 3;
    const initialThreshold = 2; // 2 out of 3 multisig

    logger.info('🏗️  Starting MultiSig contract deployment...');
    logger.info(`📋 Initial signers:`);
    logger.info(`   - Signer 1: ${signer1.address}`);
    logger.info(`   - Signer 2: ${signer2.address}`);
    logger.info(`   - Signer 3: ${signer3.address}`);
    logger.info(`📊 Initial threshold: ${initialThreshold}/${initialSignerCount}`);

    const { wormholeAddress } = await registerWormholeContracts(nodeClient, wallet);

    const deployTx = MultiSigContract.deploy(
        wallet,
        initialSigners,
        initialSignerCount,
        initialThreshold,
        wormholeAddress
    ).send({
        from: signer1.address,
        fee: { paymentMethod: sponsoredPaymentMethod }
    });

    logger.info('⏳ Waiting for deployment transaction to be mined...');
    const multisigContract = await deployTx.deployed({ timeout: timeouts.deployTimeout });

    logger.info(`🎉 MultiSig Contract deployed successfully!`);
    logger.info(`📍 Contract address: ${multisigContract.address}`);
}

main().catch((error) => {
    const logger = createLogger('aztec:multisig-deploy');
    logger.error(`❌ MultiSig deployment failed: ${error.message}`);
    logger.error(`📋 Error details: ${error.stack}`);
    process.exit(1);
});
