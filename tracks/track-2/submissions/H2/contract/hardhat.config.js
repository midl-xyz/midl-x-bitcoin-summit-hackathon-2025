require("hardhat-deploy");
require("@midl-xyz/hardhat-deploy");
const { midlRegtest } = require("@midl-xyz/midl-js-executor");
const { vars } = require("hardhat/config");
const { MempoolSpaceProvider } = require("@midl-xyz/midl-js-core");

const walletsPaths = {
  leather: "m/86'/1'/0'/0/0"
}

const accounts = [
  "tired galaxy hockey blast front glare weekend hero feature teach kitchen gap company aerobic skin poverty aunt kitchen gallery buzz entire shell bachelor work",
];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },

      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      }
    ],
  },
  midl: {
    // path: "deployments/midl",
    // confirmationsRequired: 0,
    // btcConfirmationsRequired: 1
    path: "deployments",
    networks: {
        default: {
            mnemonic: accounts[0],
            confirmationsRequired: 1,
            btcConfirmationsRequired: 1,
            hardhatNetwork: "default",
            network: {
                explorerUrl: "https://mempool.regtest.midl.xyz",
                id: "regtest",
                network: "regtest"
            },
            provider: new MempoolSpaceProvider({
                "regtest": "https://mempool.regtest.midl.xyz",
            }),
            derivationPath: "leather"
        },
    }
  },
  networks: {
    // default: {
    //   url: "https://evm-rpc.regtest.midl.xyz",
    //   chainId: 777
    // }
    default: {
      url: "https://rpc.regtest.midl.xyz",
      accounts: {
          mnemonic: "tired galaxy hockey blast front glare weekend hero feature teach kitchen gap company aerobic skin poverty aunt kitchen gallery buzz entire shell bachelor work",
          path: walletsPaths.leather
      },
      chainId: 777
  },
  },
};
