
const hre = require("hardhat");

async function main() {
 
  const fee = 5;

  const Lottery = await hre.ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(fee);

  await lottery.deployed();

  console.log(
    `Lottery deployed to ${lottery.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
