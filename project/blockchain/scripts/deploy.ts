import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("DatasetRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`DatasetRegistry deployed to: ${address}`);
  console.log("Set DATASET_REGISTRY_CONTRACT_ADDRESS in backend/.env to this value.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
