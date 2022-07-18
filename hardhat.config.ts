import { task, HardhatUserConfig } from 'hardhat/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';

import deployer from './.secret';

// const BSC_RPC = 'https://bsc-dataseed.binance.org/';
const BSC_RPC = 'https://bsc-mainnet.g.alchemy.com/v2/OOkdqTs_MldhfiyK08pcOnzUCWdtyN8J'//'https://bsc-dataseed1.defibit.io/';
const BSC_Tetsnet_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';

const config: HardhatUserConfig = {
  solidity: { version: '0.7.6' },
  networks: {
    hardhat: {
      // loggingEnabled: true,
      forking: {
        url: BSC_RPC,
        enabled: true,
      },
      accounts: {
        accountsBalance: '1000000000000000000000000', // 1 mil ether
      },
    },
    bscTestnet: {
      url: BSC_Tetsnet_RPC,
      chainId: 0x61,
      accounts: [deployer.private],
    },
    bsc: {
      url: BSC_RPC,
      chainId: 0x38,
      accounts: [deployer.private],
    },
    polygon: {
      url:"https://polygon-mainnet.infura.io/v3/8253896493d04aff810869d10a63e170",
      chainId: 0x89,
      accounts: [deployer.private],
    },
    eth: {
      url:"https://mainnet.g.alchemy.com/v2/OOkdqTs_MldhfiyK08pcOnzUCWdtyN8J",
      chainId: 0x1,
      accounts: [deployer.private],
    }
  },
  mocha: {
    timeout: 40000,
  },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = config;
