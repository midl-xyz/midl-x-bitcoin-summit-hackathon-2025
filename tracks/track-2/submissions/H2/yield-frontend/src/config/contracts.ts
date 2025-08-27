import { Address } from 'viem';

export interface ContractAddresses {
  aave: {
    poolProxy: Address;
    protocolDataProvider: Address;
    wethGateway: Address;
    wrappedTokenGateway: Address;
  };
  uniswap: {
    factory: Address;
    router: Address;
    nonfungiblePositionManager: Address;
    quoter: Address;
  };
  tokens: {
    wbtc: Address;
    usdc: Address;
    usdt: Address;
    weth: Address;
    aWBTC: Address;
    variableDebtUSDC: Address;
  };
}

export const contractAddresses: Record<number, ContractAddresses> = {
  // Sepolia Testnet
  11155111: {
    aave: {
      poolProxy: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as Address,
      protocolDataProvider: '0x3e9708d80f7B3e43118013075F7e95CE3AB31F31' as Address,
      wethGateway: '0x387d311e47e80b498169e6fb51d3193167d89F7D' as Address,
      wrappedTokenGateway: '0x387d311e47e80b498169e6fb51d3193167d89F7D' as Address,
    },
    uniswap: {
      factory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c' as Address,
      router: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E' as Address,
      nonfungiblePositionManager: '0x1238536071E1c677A632429e3655c799b22cDA52' as Address,
      quoter: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3' as Address,
    },
    tokens: {
      wbtc: '0x29f2D40B0605204364af54EC677bD022dA425d03' as Address,
      usdc: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address,
      usdt: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as Address,
      weth: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c' as Address,
      aWBTC: '0x078f358208685046a11C85e8ad32895DED33A249' as Address,
      variableDebtUSDC: '0x72E95b8931767C79bA4EeE721354d6E99a61D004' as Address,
    },
  },
  // Mainnet (placeholder addresses)
  1: {
    aave: {
      poolProxy: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as Address,
      protocolDataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as Address,
      wethGateway: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9' as Address,
      wrappedTokenGateway: '0x893411580e590D62dDBca8a703d61Cc4A8c7b2b9' as Address,
    },
    uniswap: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984' as Address,
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address,
      nonfungiblePositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' as Address,
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6' as Address,
    },
    tokens: {
      wbtc: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' as Address,
      usdc: '0xA0b86a33E6B92d3e5a8e4d1E7F7a05a56e0B9e0b' as Address,
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
      weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
      aWBTC: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8' as Address,
      variableDebtUSDC: '0x72E95b8931767C79bA4EeE721354d6E99a61D004' as Address,
    },
  },
};

export const getContractAddresses = (chainId: number): ContractAddresses => {
  return contractAddresses[chainId] || contractAddresses[11155111]; // Default to Sepolia
};