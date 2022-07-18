import fs from 'fs';
import path from 'path';
import 'lodash.combinations';
import lodash from 'lodash';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'hardhat';

import log from './log';

export enum Network {
  BSC = 'bsc',
  ETH= 'eth',
  MATIC='polygon'
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const bscBaseTokens: Tokens = {
  wbnb: { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
  usdt: { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955' },
  busd: { symbol: 'BUSD', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56' },
  eth: { symbol: 'ETH', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' },
  cake: { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
  bake: { symbol: 'BAKE', address: '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5' },
  link: { symbol: 'LINK', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD' },
};

const ethBaseTokens: Tokens = {
  busd: { symbol: 'BNB', address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' },
  usdt: { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  wbnb: { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
};

const maticBaseTokens: Tokens = {
  wmatic: { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' },
  eth: { symbol: 'ETH', address: '0xFD30BAee9842A806814675cE45D44b5519014dD7' },
  busd: { symbol: 'BUSD', address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7' },
  usdt: { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
  wbnb: { symbol: 'BNB', address: '0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005' },
};

const bscQuoteTokens: Tokens = {
  wbnb: { symbol: 'WBNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' },
  usdt: { symbol: 'USDT', address: '0x55d398326f99059ff775485246999027b3197955' },
  busd: { symbol: 'BUSD', address: '0xe9e7cea3dedca5984780bafc599bd69add087d56' },
  eth: { symbol: 'ETH', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' },
  btcb: { symbol: 'BTCB', address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' },
  cake: { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
  bake: { symbol: 'BAKE', address: '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5' },
  alpaca: { symbol: 'ALPACA', address: '0x8f0528ce5ef7b51152a59745befdd91d97091d2f' },
  band: { symbol: 'BAND', address: '0xad6caeb32cd2c308980a548bd0bc5aa4306c6c18' },
  bbadger: { symbol: 'bBADGER', address: '0x1f7216fdb338247512ec99715587bb97bbf96eae' },
  beth: { symbol: 'BETH', address: '0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B' },
  cream: { symbol: 'CREAM', address: '0xd4cb328a82bdf5f03eb737f37fa6b370aef3e888' },
  dot: { symbol: 'DOT', address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402' },
  doge: { symbol: 'DOGE', address: '0x4206931337dc273a630d328dA6441786BfaD668f' },
  mdx: { symbol: 'MDX', address: '0x9c65ab58d8d978db963e63f2bfb7121627e3a739' },
  inj: { symbol: 'INJ', address: '0xa2b726b1145a4773f68593cf171187d8ebe4d495' },
  beefy: { symbol: 'BEFI', address: '0xCa3F508B8e4Dd382eE878A314789373D80A5190A' },
  atm: { symbol: 'ATM', address: '0x25e9d05365c867e59c1904e7463af9f312296f9e' },
  badpad: { symbol: 'BSCPAD', address: '0x5a3010d4d8d3b5fb49f8b6e57fb9e48063f16700' },
  bunny: { symbol: 'BUNNY', address: '0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51' },
  eps: { symbol: 'EPS', address: '0xa7f552078dcc247c2684336020c03648500c6d9f' },
  iron: { symbol: 'IRON', address: '0x7b65b489fe53fce1f6548db886c08ad73111ddd8' },
  lina: { symbol: 'LINA', address: '0x762539b45a1dcce3d36d080f74d1aed37844b878' },
  alpha: { symbol: 'ALPHA', address: '0xa1faa113cbE53436Df28FF0aEe54275c13B40975' },
  venus: { symbol: 'XVS', address: '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63' },
  twt: { symbol: 'TWT', address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003' },
  link: { symbol: 'LINK', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD' },
  vai: { symbol: 'VAI', address: '0x4bd17003473389a42daf6a0a729f6fdb328bbbd7' },
  nerve: { symbol: 'NRV', address: '0x42f6f551ae042cbe50c739158b4f0cac0edb9096' },
  btcst: { symbol: 'BTCST', address: '0x78650b139471520656b9e7aa7a5e9276814a38e9' },
  auto: { symbol: 'AUTO', address: '0xa184088a740c695e156f91f5cc086a06bb78b827' },
  kickpad: { symbol: 'KICKPAD', address: '0xcfefa64b0ddd611b125157c41cd3827f2e8e8615' },
  oction: { symbol: 'OCTI', address: '0x6c1de9907263f0c12261d88b65ca18f31163f29d' },
  oneinch: { symbol: '1INCH', address: '0x111111111117dc0aa78b770fa6a738034120c302' },
  vancat: { symbol: 'VANCAT', address: '0x8597ba143ac509189e89aab3ba28d661a5dd9830' },
  sfp: { symbol: 'SFP', address: '0xd41fdb03ba84762dd66a0af1a6c8540ff1ba5dfb' },
  sparta: { symbol: 'SPARTA', address: '0xe4ae305ebe1abe663f261bc00534067c80ad677c' },
  tcake: { symbol: 'TCAKE', address: '0x3b831d36ed418e893f42d46ff308c326c239429f' },
  fairmoon: { symbol: 'FAIRMOON', address: '0xfe75cd11e283813ec44b4592476109ba3706cef6' },
  orakuru: { symbol: 'ORK', address: '0xced0ce92f4bdc3c2201e255faf12f05cf8206da8' },
  bgov: { symbol: 'BGOV', address: '0xf8e026dc4c0860771f691ecffbbdfe2fa51c77cf' },
  frontier: { symbol: 'FRONT', address: '0x928e55dab735aa8260af3cedada18b5f70c72f1b' },
  swampy: { symbol: 'SWAMP', address: '0xc5a49b4cbe004b6fd55b30ba1de6ac360ff9765d' },
  ele: { symbol: 'ELE', address: '0xacd7b3d9c10e97d0efa418903c0c7669e702e4c0' },
  bondly: { symbol: 'BONDLY', address: '0x96058f8c3e16576d9bd68766f3836d9a33158f89' },
  ramp: { symbol: 'RAMP', address: '0x8519ea49c997f50ceffa444d240fb655e89248aa' },
  googse: { symbol: 'EGG', address: '0xf952fc3ca7325cc27d15885d37117676d25bfda6' },
  aioz: { symbol: 'AIOZ', address: '0x33d08d8c7a168333a85285a68c0042b39fc3741d' },
  starter: { symbol: 'START', address: '0x31d0a7ada4d4c131eb612db48861211f63e57610' },
  dshare: { symbol: 'SBDO', address: '0x0d9319565be7f53cefe84ad201be3f40feae2740' },
  bdollar: { symbol: 'BDO', address: '0x190b589cf9fb8ddeabbfeae36a813ffb2a702454' },
  swipe: { symbol: 'SXP', address: '0x47bead2563dcbf3bf2c9407fea4dc236faba485a' },
  tornado: { symbol: 'TORN', address: '0x40318becc7106364D6C41981956423a7058b7455' },
  uni: { symbol: 'UNI', address: '0xbf5140a22578168fd562dccf235e5d43a02ce9b1' },
  lit: { symbol: 'LIT', address: '0xb59490aB09A0f526Cc7305822aC65f2Ab12f9723' },
  alice: { symbol: 'ALICE', address: '0xac51066d7bec65dc4589368da368b212745d63e8' },
  reef: { symbol: 'REEF', address: '0xf21768ccbc73ea5b6fd3c687208a7c2def2d966e' },
  pet: { symbol: 'PET', address: '0x4d4e595d643dc61ea7fcbf12e4b1aaa39f9975b8' },
};

const maticQuoteTokens: Tokens = {
  wmatic: { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' },
  eth: { symbol: 'ETH', address: '0xFD30BAee9842A806814675cE45D44b5519014dD7' },
  busd: { symbol: 'BUSD', address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7' },
  usdt: { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
  wbnb: { symbol: 'BNB', address: '0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005' },
  btcb: { symbol: 'BTCB', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c' },
  cake: { symbol: 'CAKE', address: '0x805262B407177c3a4AA088088c571164F645c5D0' },
  bake: { symbol: 'BAKE', address: '0x8940543528943ABa6d8A43f04B9485167886D8aF' },
  alpaca: { symbol: 'ALPACA', address: '0x850ab9638CE6dCf4F05C1b2Cc5f38c3002AAa705' },
  band: { symbol: 'BAND', address: '0xA8b1E0764f85f53dfe21760e8AfE5446D82606ac' },
  bbadger: { symbol: 'bBADGER', address: '0x1FcbE5937B0cc2adf69772D228fA4205aCF4D9b2' },
  beth: { symbol: 'BETH', address: '0x1e61f8904D1cfE679211E3A049e4576d74f5F888' },
  cream: { symbol: 'CREAM', address: '0x1Bf1af0B1fd80B5FfCc2590E1e37aaf4d015C1a1' },
  sand: { symbol: 'SAND', address: '0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683' },
  doge: { symbol: 'DOGE', address: '0xfFA38819b4e0EbF2296aDE187d06b41A7fa9652f' },
  inj: { symbol: 'INJ', address: '0x4E8dc2149EaC3f3dEf36b1c281EA466338249371' },
  beefy: { symbol: 'BEFI', address: '0xFbdd194376de19a88118e84E279b977f165d01b8' },
  atm: { symbol: 'ATM', address: '0x729696E4eea1a058ba556E513fF88d66d1f212c3' },
  bunny: { symbol: 'BUNNY', address: '0x4C16f69302CcB511c5Fac682c7626B9eF0Dc126a' },
  eps: { symbol: 'EPS', address: '0x9380b1e77BDBF004B57c9808acf9C257688D3b74' },
  iron: { symbol: 'IRON', address: '0xD86b5923F3AD7b585eD81B448170ae026c65ae9a' },
  alpha: { symbol: 'ALPHA', address: '0x0B048D6e01a6b9002C291060bF2179938fd8264c' },
  venus: { symbol: 'XVS', address: '0xe65225Db58724a26915beAa35d6872D5616CcFbd' },
  link: { symbol: 'LINK', address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39' },
  nerve: { symbol: 'NRV', address: '0x5e600D9f952ef81fa12eF61f0de99BCda75ec4fa' },
  btcst: { symbol: 'BTCST', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6' },
  oneinch: { symbol: '1INCH', address: '0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f' },
  pancat: { symbol: 'PANCAT', address: '0x8449C099D8fbF892d6e6cB3ad29dB5e4f4DCe6E3' },
  sparta: { symbol: 'SPARTA', address: '0xC8fC8215525B11fd6FB1801d497c69345eb3E174' },
  ens: { symbol: 'ENS', address: '0xbD7A5Cf51d22930B8B3Df6d834F9BCEf90EE7c4f' },
  fairmoon: { symbol: 'FAIRMOON', address: '0x99a4B33CBc5572D3b883c5ced2Ed16186a1fC7bf' },
  solana: { symbol: 'SOL', address: '0x7DfF46370e9eA5f0Bad3C4E29711aD50062EA7A4' },
  bgov: { symbol: 'BGOV', address: '0xd5d84e75f48E75f01fb2EB6dFD8eA148eE3d0FEb' },
  frontier: { symbol: 'FRONT', address: '0xa3eD22EEE92a3872709823a6970069e12A4540Eb' },
  swampy: { symbol: 'SWAMP', address: '0x5f1657896B38c4761dbc5484473c7A7C845910b6' },
  ele: { symbol: 'ELE', address: '0xAcD7B3D9c10e97d0efA418903C0c7669E702E4C0' },
  bondly: { symbol: 'BONDLY', address: '0x64ca1571d1476b7a21C5aaf9f1a750A193A103C0' },
  ramp: { symbol: 'RAMP', address: '0xaECeBfcF604AD245Eaf0D5BD68459C3a7A6399c2' },
  tron: { symbol: 'TRON', address: '0x65AF85d310E55EC26c1A3A95129914A13B4Bd8Da' },
  aioz: { symbol: 'AIOZ', address: '0xe2341718c6C0CbFa8e6686102DD8FbF4047a9e9B' },
  starter: { symbol: 'START', address: '0x021706c96957c78059956048053aa5E873490382' },
  bscstarter: { symbol: 'START', address: '0x6Ccf12B480A99C54b23647c995f4525D544A7E72' },
  dshare: { symbol: 'SBDO', address: '0xAB72EE159Ff70b64beEcBbB0FbBE58b372391C54' },
  bdollar: { symbol: 'BDO', address: '0x1eBA4B44C4F8cc2695347C6a78F0B7a002d26413' },
  swipe: { symbol: 'SXP', address: '0x6aBB753C1893194DE4a83c6e8B4EadFc105Fd5f5' },
  tornado: { symbol: 'TORN', address: '0x23fE1Ee2f536427B7e8aC02FB037A7f867037Fe8' },
  uni: { symbol: 'UNI', address: '0xb33EaAd8d922B1083446DC23f610c2567fB5180f' },
  lit: { symbol: 'LIT', address: '0xe6E320b7bB22018D6CA1F4D8cea1365eF5d25ced' },
  sushi: { symbol: 'SLP', address: '0x35c1895DAC1e2432b320e2927b4F71a0D995602F' },
  reef: { symbol: 'REEF', address: '0xa383abD0fE30fa2b781c0b454bfcC0475c6c8844' },
  pet: { symbol: 'PET', address: '0x398F83FE6663Df6a5e5E6Fe441525dD877Ad32e2' }
};

// const ethQuoteTokens: Tokens = {
//   wmatic: { symbol: 'WMATIC', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' },
//   eth: { symbol: 'ETH', address: '0xFD30BAee9842A806814675cE45D44b5519014dD7' },
//   busd: { symbol: 'BUSD', address: '0xdAb529f40E671A1D4bF91361c21bf9f0C9712ab7' },
//   usdt: { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
//   wbnb: { symbol: 'BNB', address: '0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005' },
//   btcb: { symbol: 'BTCB', address: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c' },
//   cake: { symbol: 'CAKE', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' },
//   bake: { symbol: 'BAKE', address: '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5' },
//   alpaca: { symbol: 'ALPACA', address: '0x8f0528ce5ef7b51152a59745befdd91d97091d2f' },
//   band: { symbol: 'BAND', address: '0xad6caeb32cd2c308980a548bd0bc5aa4306c6c18' },
//   bbadger: { symbol: 'bBADGER', address: '0x1f7216fdb338247512ec99715587bb97bbf96eae' },
//   beth: { symbol: 'BETH', address: '0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B' },
//   cream: { symbol: 'CREAM', address: '0xd4cb328a82bdf5f03eb737f37fa6b370aef3e888' },
//   dot: { symbol: 'DOT', address: '0x7083609fce4d1d8dc0c979aab8c869ea2c873402' },
//   doge: { symbol: 'DOGE', address: '0x4206931337dc273a630d328dA6441786BfaD668f' },
//   mdx: { symbol: 'MDX', address: '0x9c65ab58d8d978db963e63f2bfb7121627e3a739' },
//   inj: { symbol: 'INJ', address: '0xa2b726b1145a4773f68593cf171187d8ebe4d495' },
//   beefy: { symbol: 'BEFI', address: '0xCa3F508B8e4Dd382eE878A314789373D80A5190A' },
//   atm: { symbol: 'ATM', address: '0x25e9d05365c867e59c1904e7463af9f312296f9e' },
//   badpad: { symbol: 'BSCPAD', address: '0x5a3010d4d8d3b5fb49f8b6e57fb9e48063f16700' },
//   bunny: { symbol: 'BUNNY', address: '0xc9849e6fdb743d08faee3e34dd2d1bc69ea11a51' },
//   eps: { symbol: 'EPS', address: '0xa7f552078dcc247c2684336020c03648500c6d9f' },
//   iron: { symbol: 'IRON', address: '0x7b65b489fe53fce1f6548db886c08ad73111ddd8' },
//   lina: { symbol: 'LINA', address: '0x762539b45a1dcce3d36d080f74d1aed37844b878' },
//   alpha: { symbol: 'ALPHA', address: '0xa1faa113cbE53436Df28FF0aEe54275c13B40975' },
//   venus: { symbol: 'XVS', address: '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63' },
//   twt: { symbol: 'TWT', address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003' },
//   link: { symbol: 'LINK', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD' },
//   vai: { symbol: 'VAI', address: '0x4bd17003473389a42daf6a0a729f6fdb328bbbd7' },
//   nerve: { symbol: 'NRV', address: '0x42f6f551ae042cbe50c739158b4f0cac0edb9096' },
//   btcst: { symbol: 'BTCST', address: '0x78650b139471520656b9e7aa7a5e9276814a38e9' },
//   auto: { symbol: 'AUTO', address: '0xa184088a740c695e156f91f5cc086a06bb78b827' },
//   kickpad: { symbol: 'KICKPAD', address: '0xcfefa64b0ddd611b125157c41cd3827f2e8e8615' },
//   oction: { symbol: 'OCTI', address: '0x6c1de9907263f0c12261d88b65ca18f31163f29d' },
//   oneinch: { symbol: '1INCH', address: '0x111111111117dc0aa78b770fa6a738034120c302' },
//   vancat: { symbol: 'VANCAT', address: '0x8597ba143ac509189e89aab3ba28d661a5dd9830' },
//   sfp: { symbol: 'SFP', address: '0xd41fdb03ba84762dd66a0af1a6c8540ff1ba5dfb' },
//   sparta: { symbol: 'SPARTA', address: '0xe4ae305ebe1abe663f261bc00534067c80ad677c' },
//   tcake: { symbol: 'TCAKE', address: '0x3b831d36ed418e893f42d46ff308c326c239429f' },
//   fairmoon: { symbol: 'FAIRMOON', address: '0xfe75cd11e283813ec44b4592476109ba3706cef6' },
//   orakuru: { symbol: 'ORK', address: '0xced0ce92f4bdc3c2201e255faf12f05cf8206da8' },
//   bgov: { symbol: 'BGOV', address: '0xf8e026dc4c0860771f691ecffbbdfe2fa51c77cf' },
//   frontier: { symbol: 'FRONT', address: '0x928e55dab735aa8260af3cedada18b5f70c72f1b' },
//   swampy: { symbol: 'SWAMP', address: '0xc5a49b4cbe004b6fd55b30ba1de6ac360ff9765d' },
//   ele: { symbol: 'ELE', address: '0xacd7b3d9c10e97d0efa418903c0c7669e702e4c0' },
//   bondly: { symbol: 'BONDLY', address: '0x96058f8c3e16576d9bd68766f3836d9a33158f89' },
//   ramp: { symbol: 'RAMP', address: '0x8519ea49c997f50ceffa444d240fb655e89248aa' },
//   googse: { symbol: 'EGG', address: '0xf952fc3ca7325cc27d15885d37117676d25bfda6' },
//   aioz: { symbol: 'AIOZ', address: '0x33d08d8c7a168333a85285a68c0042b39fc3741d' },
//   starter: { symbol: 'START', address: '0x31d0a7ada4d4c131eb612db48861211f63e57610' },
//   dshare: { symbol: 'SBDO', address: '0x0d9319565be7f53cefe84ad201be3f40feae2740' },
//   bdollar: { symbol: 'BDO', address: '0x190b589cf9fb8ddeabbfeae36a813ffb2a702454' },
//   swipe: { symbol: 'SXP', address: '0x47bead2563dcbf3bf2c9407fea4dc236faba485a' },
//   tornado: { symbol: 'TORN', address: '0x40318becc7106364D6C41981956423a7058b7455' },
//   uni: { symbol: 'UNI', address: '0xbf5140a22578168fd562dccf235e5d43a02ce9b1' },
//   lit: { symbol: 'LIT', address: '0xb59490aB09A0f526Cc7305822aC65f2Ab12f9723' },
//   alice: { symbol: 'ALICE', address: '0xac51066d7bec65dc4589368da368b212745d63e8' },
//   reef: { symbol: 'REEF', address: '0xf21768ccbc73ea5b6fd3c687208a7c2def2d966e' },
//   pet: { symbol: 'PET', address: '0x4d4e595d643dc61ea7fcbf12e4b1aaa39f9975b8' },
// };

const bscDexes: AmmFactories = {
  pancake: '0xBCfCcbde45cE874adCB698cC183deBcF17952812',
  mdex: '0x3CD1C46068dAEa5Ebb0d3f55F6915B10648062B8',
  bakery: '0x01bF7C66c6BD861915CdaaE475042d3c4BaE16A7',
  julswap: '0x553990F2CBA90272390f62C5BDb1681fFc899675',
   apeswap: '0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6',
  // value: '0x1B8E12F839BD4e73A47adDF76cF7F0097d74c14C',
};

// const ethDexes: AmmFactories = {
//   uniswap: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
//   sushiswap: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
//   luaswap: '0x0388C1E0f210AbAe597B7DE712B9510C6C36C857',
//   inch: '0xbAF9A5d4b0052359326A6CDAb54BABAa3a3A9643',
//   //  apeswap: '0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6',
//   // value: '0x1B8E12F839BD4e73A47adDF76cF7F0097d74c14C',
// };

const polygonDexes: AmmFactories = {
  quickswap: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
  //uniswap: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  sushiswap: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  //julswap: '0x553990F2CBA90272390f62C5BDb1681fFc899675',
  apeswap: '0xCf083Be4164828f00cAE704EC15a36D711491284',
  // value: '0x1B8E12F839BD4e73A47adDF76cF7F0097d74c14C',
};

function getFactories(network: Network): AmmFactories {
  switch (network) {
    case Network.BSC:
      return bscDexes;
    case Network.ETH:
        return bscDexes;
    case Network.MATIC:
          return polygonDexes;
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

export function getTokens(network: Network): [Tokens, Tokens] {
  switch (network) {
    case Network.BSC:
      return [bscBaseTokens, bscQuoteTokens];
    case Network.ETH:
      return [bscBaseTokens, bscQuoteTokens];
    case Network.MATIC:
      return [maticBaseTokens, maticQuoteTokens];
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

async function updatePairs(network: Network): Promise<ArbitragePair[]> {
  log.info('Updating arbitrage token pairs');
  const [baseTokens, quoteTokens] = getTokens(network);
  const factoryAddrs = getFactories(network);

  const factoryAbi = ['function getPair(address, address) view returns (address pair)'];
  let factories: Contract[] = [];

  log.info(`Fetch from dexes: ${Object.keys(factoryAddrs)}`);
  for (const key in factoryAddrs) {
    const addr = factoryAddrs[key];
    const factory = new ethers.Contract(addr, factoryAbi, ethers.provider);
    factories.push(factory);
  }

  let tokenPairs: TokenPair[] = [];
  for (const key in quoteTokens) {
    const baseToken = baseTokens[key];
    for (const quoteKey in quoteTokens) {
      if(key == quoteKey) continue;
      const quoteToken = quoteTokens[quoteKey];
      if(!baseToken?.address || !quoteToken?.address) continue
      let tokenPair: TokenPair = { symbols: `${quoteToken.symbol}-${baseToken.symbol}`, pairs: [] };
      
      for (const factory of factories) {
        const pair = await factory.getPair(baseToken.address, quoteToken.address);
        if (pair != ZERO_ADDRESS) {
          tokenPair.pairs.push(pair);
        }
      }
      if (tokenPair.pairs.length >= 2) {
        tokenPairs.push(tokenPair);
      }
      console.log({key, quoteKey})
    }
  }

  console.log('scrapped')
  
  let allPairs: ArbitragePair[] = [];
  for (const tokenPair of tokenPairs) {
    if (tokenPair.pairs.length < 2) {
      continue;
    } else if (tokenPair.pairs.length == 2) {
      allPairs.push(tokenPair as ArbitragePair);
    } else {
      // @ts-ignore
      const combinations = lodash.combinations(tokenPair.pairs, 2);
      for (const pair of combinations) {
        const arbitragePair: ArbitragePair = {
          symbols: tokenPair.symbols,
          pairs: pair,
        };
        allPairs.push(arbitragePair);
      }
    }
  }
  return allPairs;
}

function getPairsFile(network: Network) {
  return path.join(__dirname, `../pairs-${network}.json`);
}

export async function tryLoadPairs(network: Network): Promise<ArbitragePair[]> {
  let pairs: ArbitragePair[] | null;
  const pairsFile = getPairsFile(network);
  try {
    pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf-8'));
    log.info('Load pairs from json');
  } catch (err) {
    pairs = null;
  }

  if (pairs) {
    return pairs;
  }
  pairs = await updatePairs(network);
  console.log('done')

  fs.writeFileSync(pairsFile, JSON.stringify(pairs, null, 2));
  return pairs;
}
