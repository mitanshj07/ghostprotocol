const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function deployFixture() {
  const [owner, beneficiaryA, beneficiaryB, guardian, recipient, caller] = await ethers.getSigners();

  const MockVerifier = await ethers.getContractFactory("MockLivenessVerifier");
  const verifier = await MockVerifier.deploy();

  const GhostVault = await ethers.getContractFactory("GhostVault");
  const vault = await GhostVault.deploy(await verifier.getAddress());

  const beneficiaries = [
    [beneficiaryA.address, 60, "A"],
    [beneficiaryB.address, 40, "B"]
  ];

  return {
    owner,
    beneficiaryA,
    beneficiaryB,
    guardian,
    recipient,
    caller,
    verifier,
    vault,
    beneficiaries
  };
}

describe("GhostVault", function () {
  it("creates a vault with valid beneficiaries", async function () {
    const { owner, vault, beneficiaries } = await deployFixture();

    await expect(
      vault.connect(owner).createVault(12345, 7, beneficiaries, "ipfs://meta", {
        value: ethers.parseEther("1")
      })
    ).to.emit(vault, "VaultCreated");

    const info = await vault.getVaultInfo(owner.address);
    expect(info.ethBalance).to.equal(ethers.parseEther("1"));

    const stored = await vault.getBeneficiaries(owner.address);
    expect(stored).to.have.length(2);
    expect(stored[0].percentage).to.equal(60);
  });

  it("submits a liveness proof and rejects replayed nullifiers", async function () {
    const { owner, vault, beneficiaries } = await deployFixture();
    await vault.connect(owner).createVault(777, 7, beneficiaries, "");

    const proof = [[1, 2], [[3, 4], [5, 6]], [7, 8], [777, 999]];
    await expect(vault.connect(owner).submitLivenessProof(...proof))
      .to.emit(vault, "CheckInSubmitted");

    await expect(vault.connect(owner).submitLivenessProof(...proof))
      .to.be.revertedWith("Proof already used");
  });

  it("rejects invalid verifier responses", async function () {
    const { owner, vault, verifier, beneficiaries } = await deployFixture();
    await vault.connect(owner).createVault(777, 7, beneficiaries, "");
    await verifier.setValid(false);

    await expect(
      vault.connect(owner).submitLivenessProof([1, 2], [[3, 4], [5, 6]], [7, 8], [777, 1000])
    ).to.be.revertedWith("Invalid ZK proof");
  });

  it("confirms guardians and reveals messages at stage 2", async function () {
    const { owner, guardian, recipient, vault, beneficiaries } = await deployFixture();
    await vault.connect(owner).createVault(888, 1, beneficiaries, "");
    await vault.connect(owner).addGuardian(guardian.address, "ipfs://shard");
    await vault.connect(guardian).confirmGuardianRole(owner.address);
    await vault.connect(owner).addMessage(recipient.address, "ipfs://message");

    const guardians = await vault.getGuardians(owner.address);
    expect(guardians[0].confirmed).to.equal(true);

    await time.increase(2 * 24 * 60 * 60);
    await vault.executeStage1(owner.address);

    await time.increase(6 * 24 * 60 * 60);
    await vault.executeStage2(owner.address);

    expect(await vault.connect(recipient).revealMessage(owner.address)).to.equal("ipfs://message");
  });

  it("cascades execution and pays beneficiaries", async function () {
    const { owner, beneficiaryA, beneficiaryB, vault, beneficiaries } = await deployFixture();
    await vault.connect(owner).createVault(999, 1, beneficiaries, "", {
      value: ethers.parseEther("1")
    });

    await time.increase(2 * 24 * 60 * 60);
    await vault.executeStage1(owner.address);

    await time.increase(6 * 24 * 60 * 60);
    await vault.executeStage2(owner.address);

    await time.increase(23 * 24 * 60 * 60);
    await expect(() => vault.executeStage3(owner.address)).to.changeEtherBalances(
      [beneficiaryA, beneficiaryB],
      [ethers.parseEther("0.6"), ethers.parseEther("0.4")]
    );

    await time.increase(60 * 24 * 60 * 60);
    await vault.executeStage4(owner.address);

    const info = await vault.getVaultInfo(owner.address);
    expect(info.state).to.equal(2);
    expect(info.stage).to.equal(4);
  });
});
