import { ethers, run } from 'hardhat';

import deployer from '../.secret';

// WBNB address on BSC, WETH address on ETH, WMATIC on POLYGON
const WethAddr = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'//'0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

async function main() {
  await run('compile');
  const FlashBot = await ethers.getContractFactory('FlashBot');
  const flashBot = await FlashBot.deploy(WethAddr);

  console.log(`FlashBot deployed to ${flashBot.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
