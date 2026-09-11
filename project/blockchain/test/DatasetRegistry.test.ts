import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("DatasetRegistry", function () {
  async function deploy() {
    const Factory = await ethers.getContractFactory("DatasetRegistry");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }

  it("registers a dataset and verifies a matching hash", async function () {
    const contract = await deploy();
    const hash = keccak256(toUtf8Bytes("dataset-contents-v1"));

    await contract.registerDataset("DS-2026-0001", hash, 1);

    const tx = await contract.verifyDataset.staticCall("DS-2026-0001", hash);
    expect(tx[0]).to.equal(true);
    expect(tx[1]).to.equal(1n);
  });

  it("detects a tampered dataset (hash mismatch)", async function () {
    const contract = await deploy();
    const originalHash = keccak256(toUtf8Bytes("dataset-contents-v1"));
    const tamperedHash = keccak256(toUtf8Bytes("dataset-contents-v1-modified"));

    await contract.registerDataset("DS-2026-0002", originalHash, 1);

    const result = await contract.verifyDataset.staticCall("DS-2026-0002", tamperedHash);
    expect(result[0]).to.equal(false);
  });

  it("reverts verification for an unregistered dataset", async function () {
    const contract = await deploy();
    await expect(
      contract.verifyDataset.staticCall("DS-UNKNOWN", keccak256(toUtf8Bytes("x")))
    ).to.be.revertedWith("No registration found for datasetId");
  });

  it("keeps a full history across multiple versions", async function () {
    const contract = await deploy();
    const hashV1 = keccak256(toUtf8Bytes("v1"));
    const hashV2 = keccak256(toUtf8Bytes("v2"));

    await contract.registerDataset("DS-2026-0003", hashV1, 1);
    await contract.registerDataset("DS-2026-0003", hashV2, 2);

    const history = await contract.getDatasetHistory("DS-2026-0003");
    expect(history.length).to.equal(2);
    expect(history[1].version).to.equal(2n);
  });
});
