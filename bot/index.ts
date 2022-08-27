import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import pool from '@ricokahler/pool';
import AsyncLock from 'async-lock';

//import { FlashBot } from '../typechain/FlashBot';
import { Network, tryLoadPairs, getTokens } from './tokens';
import { getBnbPrice } from './basetoken-price';
import log from './log';
import config from './config';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function calcNetProfit(profitWei: BigNumber, address: string, baseTokens: Tokens): Promise<number> {
  let price = 10;
  if (baseTokens.wmatic.address == address) {
    price = 1 //await getBnbPrice();
  }
  let profit = parseFloat(ethers.utils.formatEther(profitWei));
  profit = profit * price;

  const gasCost = price * parseFloat(ethers.utils.formatEther(config.gasPrice)) * (config.gasLimit as number);
  //console.log({price, profit, gasCost})
  return profit - gasCost;
}

function arbitrageFunc(flashBot: any, baseTokens: Tokens) {
  const lock = new AsyncLock({ timeout: 100, maxPending: 25000 });
  return async function arbitrage(pair: ArbitragePair) {
    const [pair0, pair1] = pair.pairs;
    //console.log(pair0, pair1)

    let res: [BigNumber, string] & {
      profit: BigNumber;
      baseToken: string;
    };
    
    try {
      res = await flashBot.getProfit(pair0, pair1);
      //console.log(`Profit on ${pair.symbols}: ${ethers.utils.formatEther(res.profit)}`);
    } catch (err) {
      //console.log({err});
      return;
    }

    if (res.profit.gt(BigNumber.from('0'))) {
      const netProfit = await calcNetProfit(res.profit, res.baseToken, baseTokens);
      log.info(`Net Profit on ${pair.symbols}: ${netProfit}`);
      if (netProfit < config.minimumProfit) {
        return null;
      }

      log.info(`Calling flash arbitrage, net profit: ${netProfit}`);
      //console.log({pair0, pair1})
      try {
        // lock to prevent tx nonce overlap
        await lock.acquire('flash-bot', async () => {
          
          const response = await flashBot.flashArbitrage(pair0, pair1, {
            gasPrice: config.gasPrice,
            gasLimit: config.gasLimit,
          });
          const receipt = await response.wait(1);
          log.info(`Tx: ${receipt.transactionHash}`);
        });
      } catch (err: any) {
        if (err.message === 'Too much pending tasks' || err.message === 'async-lock timed out') {
          return;
        }
        log.error(err);
      }
    }
  };
}

async function main() {
  const pairs = await tryLoadPairs(Network.MATIC);
  
  const flashBot = (await ethers.getContractAt('FlashBot', config.contractAddr));
  const [baseTokens] = getTokens(Network.MATIC);
  
  
  log.info('Start arbitraging');
  console.log(pairs.length)
  while (true) {
    await pool({
      collection: pairs.slice(20,30),
      task: arbitrageFunc(flashBot, baseTokens),
      maxConcurrency: config.concurrency,
    });
    await sleep(0.0001);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error(err);
    process.exit(1);
  });
