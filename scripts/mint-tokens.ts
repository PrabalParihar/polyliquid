import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🪙 Minting Test Tokens for Frontend Testing");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Target address to mint tokens to
  const TARGET_ADDRESS = "0xE5FB6be08698719926C54ccC2BF857Bfe8Af0eD8";
  
  // Contract addresses based on network
  let contracts: { [key: string]: string } = {};
  
  if (network.chainId === 11155111n) { // Sepolia
    contracts = {
      stETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      rETH: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
      sAVAX: '0x515958d0e0f2a7B8da4B4D39F8C42d22f2ce0B03',
    };
    console.log("📍 Using NEW Sepolia testnet contracts");
  } else if (network.chainId === 43113n) { // Fuji
    contracts = {
      stETH: '0x7185D90BCD120dE7d091DF6EA8bd26e912571b61',
      rETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      sAVAX: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
    };
    console.log("📍 Using LATEST Fuji testnet contracts");
  } else {
    console.log("❌ Unsupported network. Please use Sepolia (11155111) or Fuji (43113)");
    return;
  }

  // Amount to mint (10,000 tokens each for testing)
  const MINT_AMOUNT = ethers.parseEther("10000");
  
  console.log(`\n🎯 Minting ${ethers.formatEther(MINT_AMOUNT)} of each token to: ${TARGET_ADDRESS}`);

  try {
    // Get contract instances
    const stETH = await ethers.getContractAt("MockLST", contracts.stETH);
    const rETH = await ethers.getContractAt("MockLST", contracts.rETH);
    const sAVAX = await ethers.getContractAt("MockLST", contracts.sAVAX);

    // Check if contracts exist and get names
    console.log("\n📋 Contract Information:");
    console.log("stETH:", await stETH.name(), "at", contracts.stETH);
    console.log("rETH:", await rETH.name(), "at", contracts.rETH);
    console.log("sAVAX:", await sAVAX.name(), "at", contracts.sAVAX);

    // Check current balances before minting
    console.log("\n📊 Current Balances (before minting):");
    console.log("stETH:", ethers.formatEther(await stETH.balanceOf(TARGET_ADDRESS)));
    console.log("rETH:", ethers.formatEther(await rETH.balanceOf(TARGET_ADDRESS)));
    console.log("sAVAX:", ethers.formatEther(await sAVAX.balanceOf(TARGET_ADDRESS)));

    // Mint tokens
    console.log("\n💰 Minting tokens...");
    
    console.log("⏳ Minting stETH...");
    const mintTx1 = await stETH.mint(TARGET_ADDRESS, MINT_AMOUNT);
    console.log("Transaction:", mintTx1.hash);
    await mintTx1.wait();
    console.log("✅ stETH minted!");

    console.log("⏳ Minting rETH...");
    const mintTx2 = await rETH.mint(TARGET_ADDRESS, MINT_AMOUNT);
    console.log("Transaction:", mintTx2.hash);
    await mintTx2.wait();
    console.log("✅ rETH minted!");

    console.log("⏳ Minting sAVAX...");
    const mintTx3 = await sAVAX.mint(TARGET_ADDRESS, MINT_AMOUNT);
    console.log("Transaction:", mintTx3.hash);
    await mintTx3.wait();
    console.log("✅ sAVAX minted!");

    // Check final balances
    console.log("\n📊 Final Balances (after minting):");
    console.log("stETH:", ethers.formatEther(await stETH.balanceOf(TARGET_ADDRESS)));
    console.log("rETH:", ethers.formatEther(await rETH.balanceOf(TARGET_ADDRESS)));
    console.log("sAVAX:", ethers.formatEther(await sAVAX.balanceOf(TARGET_ADDRESS)));

    console.log("\n🎉 Token minting completed successfully!");
    console.log("🔗 You can now test deposits/withdrawals in your frontend!");
    
    // Additional helpful information
    console.log("\n📝 Quick Reference:");
    console.log("Target Address:", TARGET_ADDRESS);
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    console.log("\nContract Addresses:");
    console.log("stETH:", contracts.stETH);
    console.log("rETH:", contracts.rETH);
    console.log("sAVAX:", contracts.sAVAX);

  } catch (error: any) {
    console.error("❌ Error minting tokens:", error.message);
    
    if (error.message.includes("revert")) {
      console.log("\n💡 Possible issues:");
      console.log("- Make sure you're connected to the right network");
      console.log("- Check if the contracts are deployed on this network");
      console.log("- Ensure your account has enough ETH for gas fees");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 