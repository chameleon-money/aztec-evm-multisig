import { deploySigners } from "./config";

async function main() {
  const signers = await deploySigners();
  console.log(signers.map((signer) => signer.address));
}

main().catch(console.error);
