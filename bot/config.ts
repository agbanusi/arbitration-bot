import { BigNumber, BigNumberish, utils } from 'ethers';

interface Config {
  contractAddr: string;
  logLevel: string;
  minimumProfit: number;
  gasPrice: BigNumber;
  gasLimit: BigNumberish;
  bscScanUrl: string;
  concurrency: number;
}

const contractAddr = '0xcDba6c96d4F4c67F417Aa7e7BCb65e0EC3DbbbA4'//'0x0fcBFb91FBE9DD8F93Ff03DadB934b3daFa1885E'; // flash bot contract address
const gasPrice = utils.parseUnits('60', 'gwei');
const gasLimit = 500000;

const bscScanApiKey = 'S6VWP4GTW6AIR2W33PEPAJK3Y8TBFMUJ1D'; // bscscan API key
const bscScanUrl = `https://api.bscscan.com/api?module=stats&action=bnbprice&apikey=${bscScanApiKey}`;

const config: Config = {
  contractAddr: contractAddr,
  logLevel: 'info',
  concurrency: 25000,
  minimumProfit: 5, // in USD
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  bscScanUrl: bscScanUrl,
};

export default config;
