const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry", function () {
  it("register & read", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("Registry");
    const reg = await Registry.deploy();
    await reg.deployed();
    const hash = "0x" + "11".repeat(32);
    await reg.register(hash, "hello");
    const rec = await reg.get(hash);
    expect(rec.owner).to.equal(owner.address);
    expect(rec.note).to.equal("hello");
  });
});
