import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 PolyLiquidVault Interaction Demo");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // You'll need to replace these addresses with actual deployed contract addresses
  // Get them from the deployment script output
  const VAULT_ADDRESS = ""; // Replace with actual vault address
  const STETH_ADDRESS = ""; // Replace with actual stETH address
  const RETH_ADDRESS = "";  // Replace with actual rETH address
  const SAVAX_ADDRESS = ""; // Replace with actual sAVAX address

  if (!VAULT_ADDRESS || !STETH_ADDRESS || !RETH_ADDRESS || !SAVAX_ADDRESS) {
    console.log("❌ Please update the contract addresses in this script first!");
    console.log("Run 'npm run deploy:fuji' or another network deployment command to get addresses.");
    return;
  }

  // Get contract instances
  const vault = await ethers.getContractAt("PolyLiquidVault", VAULT_ADDRESS);
  const stETH = await ethers.getContractAt("MockStETH", STETH_ADDRESS);
  const rETH = await ethers.getContractAt("MockRETH", RETH_ADDRESS);
  const sAVAX = await ethers.getContractAt("MockSAVAX", SAVAX_ADDRESS);

  console.log("\n📊 Vault Information:");
  console.log("Vault Name:", await vault.name());
  console.log("Vault Symbol:", await vault.symbol());
  console.log("Total Assets:", ethers.formatEther(await vault.totalAssets()));

  // 1. Mint some test tokens
  console.log("\n💰 Minting test tokens...");
  const mintAmount = ethers.parseEther("1000");
  
  await stETH.mint(deployer.address, mintAmount);
  await rETH.mint(deployer.address, mintAmount);
  await sAVAX.mint(deployer.address, mintAmount);

  console.log("Minted 1000 of each token to", deployer.address);

  // 2. Check balances
  console.log("\n📋 Token Balances:");
  console.log("stETH:", ethers.formatEther(await stETH.balanceOf(deployer.address)));
  console.log("rETH:", ethers.formatEther(await rETH.balanceOf(deployer.address)));
  console.log("sAVAX:", ethers.formatEther(await sAVAX.balanceOf(deployer.address)));
  console.log("PLY Shares:", ethers.formatEther(await vault.balanceOf(deployer.address)));

  // 3. Approve vault to spend tokens
  console.log("\n✅ Approving vault to spend tokens...");
  await stETH.approve(VAULT_ADDRESS, ethers.MaxUint256);
  await rETH.approve(VAULT_ADDRESS, ethers.MaxUint256);
  await sAVAX.approve(VAULT_ADDRESS, ethers.MaxUint256);
  console.log("Approvals completed");

  // 4. Deposit tokens
  console.log("\n🏦 Depositing tokens into vault...");
  const depositAmount = ethers.parseEther("100");

  // Deposit stETH
  console.log("Depositing 100 stETH...");
  const depositTx1 = await vault.deposit(STETH_ADDRESS, depositAmount, deployer.address);
  await depositTx1.wait();

  // Deposit rETH
  console.log("Depositing 100 rETH...");
  const depositTx2 = await vault.deposit(RETH_ADDRESS, depositAmount, deployer.address);
  await depositTx2.wait();

  // Deposit sAVAX
  console.log("Depositing 100 sAVAX...");
  const depositTx3 = await vault.deposit(SAVAX_ADDRESS, depositAmount, deployer.address);
  await depositTx3.wait();

  // 5. Check vault state after deposits
  console.log("\n📊 Vault State After Deposits:");
  console.log("Total Assets:", ethers.formatEther(await vault.totalAssets()));
  console.log("Your PLY Shares:", ethers.formatEther(await vault.balanceOf(deployer.address)));
  console.log("stETH in vault:", ethers.formatEther(await vault.totalAssetsPerAsset(STETH_ADDRESS)));
  console.log("rETH in vault:", ethers.formatEther(await vault.totalAssetsPerAsset(RETH_ADDRESS)));
  console.log("sAVAX in vault:", ethers.formatEther(await vault.totalAssetsPerAsset(SAVAX_ADDRESS)));

  // 6. Preview operations
  console.log("\n🔍 Preview Operations:");
  const previewDeposit = await vault.previewDeposit(STETH_ADDRESS, ethers.parseEther("50"));
  console.log("Preview depositing 50 stETH would give shares:", ethers.formatEther(previewDeposit));

  const previewWithdraw = await vault.previewWithdraw(RETH_ADDRESS, ethers.parseEther("25"));
  console.log("Preview withdrawing 25 rETH would cost shares:", ethers.formatEther(previewWithdraw));

  // 7. Perform a withdrawal
  console.log("\n💸 Withdrawing 50 stETH...");
  const withdrawAmount = ethers.parseEther("50");
  const withdrawTx = await vault.withdraw(STETH_ADDRESS, withdrawAmount, deployer.address, deployer.address);
  await withdrawTx.wait();

  // 8. Final state check
  console.log("\n📊 Final State:");
  console.log("Total Assets in Vault:", ethers.formatEther(await vault.totalAssets()));
  console.log("Your PLY Shares:", ethers.formatEther(await vault.balanceOf(deployer.address)));
  console.log("Your stETH Balance:", ethers.formatEther(await stETH.balanceOf(deployer.address)));

  console.log("\n✅ Interaction demo completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 