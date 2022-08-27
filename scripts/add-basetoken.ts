import { ethers } from 'hardhat';
import { FlashBot } from '../typechain/FlashBot';

async function main() {
  const maticBaseTokens: any = {
    wmatic: { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' },
    eth: { symbol: 'ETH', address: '0xFD30BAee9842A806814675cE45D44b5519014dD7' },
    busd: { symbol: 'BUSD', address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7' },
    usdt: { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
    wbnb: { symbol: 'BNB', address: '0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005' },
  };

  const [signer] = await ethers.getSigners();
  const flashBot: FlashBot = (await ethers.getContractAt(
    'FlashBot',
    '0xcDba6c96d4F4c67F417Aa7e7BCb65e0EC3DbbbA4', // your contract address
    signer
  )) as FlashBot;

  // Object.values(maticBaseTokens).map(async(val: any)=>{
  //   console.log('start', val.address)
  //   let result = await flashBot.addBaseToken(val.address);
  //   console.log({result})
  //   console.log(`Base token added: ${val.address}`);
  // })
    let result = await flashBot.addBaseToken(maticBaseTokens["wbnb"].address);
    console.log({result})
    console.log(`Base token added: ${maticBaseTokens["wbnb"].address}`);
}

//const args = process.argv.slice(2);

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
