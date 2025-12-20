import { network } from "hardhat";
import { parseEther } from "viem";

const { viem } = await network.connect({
    network: "arbitrum_sepolia",
    chainType: "l1",
});

console.log("Sending transaction using the Arbitrum Sepolia chain type");

const wormholeArbitrumSepolia = "0x6b9C8671cdDC8dEab9c719bB87cBd3e782bA6a35";

async function main() {
    const treasury = await viem.deployContract("Treasury", [wormholeArbitrumSepolia]);
    console.log("Treasury deployed to:", treasury.address);

    const wallets = await viem.getWalletClients();
    const firstAccount = wallets[0];
    const address = (await firstAccount.getAddresses())[0] as `0x${string}`;

    const usdc = await viem.deployContract("Token", ["USDC", "USDC", 18n]);
    console.log("USDC deployed to:", usdc.address);
    await usdc.write.mint([address, parseEther("10000")]);
    await usdc.write.mint([treasury.address, parseEther("10000")]);

    const usdt = await viem.deployContract("Token", ["USDT", "USDT", 18n]);
    console.log("USDT deployed to:", usdt.address);
    await usdt.write.mint([address, parseEther("10000")]);
    await usdt.write.mint([treasury.address, parseEther("10000")]);

    const dai = await viem.deployContract("Token", ["DAI", "DAI", 18n]);
    console.log("DAI deployed to:", dai.address);
    await dai.write.mint([address, parseEther("10000")]);
    await dai.write.mint([treasury.address, parseEther("10000")]);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
