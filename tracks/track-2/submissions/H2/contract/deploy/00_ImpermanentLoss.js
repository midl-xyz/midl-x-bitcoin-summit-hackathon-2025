const { ethers } = require("@midl-xyz/ethers");
const { weiToSatoshis } = require('@midl-xyz/midl-js-executor');

const TESTNET_TOKEN_PREFIX = `TestnetMock`;
const TESTNET_PRICE_AGGR_PREFIX = `TestnetOracleMock`;
const POOL_PROXY_ID = "PoolProxy";
const UniswapV2RouterAddress = "0xB1F1C1A72dFb4F90d3794a3496703D6cBAAC72FA";
const UniswapV2FactoryAddress = "0x7C94B93aafB0aF2F58703B56c5EF18Fd10A6Ee06";

const provider = new ethers.JsonRpcProvider("https://rpc.regtest.midl.xyz");

module.exports = async function deploy(hre) {
    await hre.midl.initialize();
    
    const HeliosPool = await hre.midl.getDeployment(POOL_PROXY_ID);
    const BTC_USD_Oracle =  await hre.midl.getDeployment(`BTC${TESTNET_PRICE_AGGR_PREFIX}`);
    // const Helios_BTC_Token =  await hre.midl.getDeployment(`BTC${HTOKEN_PREFIX}`);
    const Helios_BTC_Token_addr= "0x14c6BaAcD7f25bE86b8e606A39D1959f562dD64C"
    const BTC_Token =  await hre.midl.getDeployment(`BTC${TESTNET_TOKEN_PREFIX}`);
    const BTC_Token_Inst = new ethers.Contract(
        BTC_Token.address,
        BTC_Token.abi,
        provider
    );
    const BTC_decimal = await BTC_Token_Inst.decimals();
    console.log(BTC_decimal)
    const USDT_Token =  await hre.midl.getDeployment(`USDT${TESTNET_TOKEN_PREFIX}`);
    const USDT_Token_Inst = new ethers.Contract(
        BTC_Token.address,
        BTC_Token.abi,
        provider
    );
    const USDT_decimal = await USDT_Token_Inst.decimals();
    console.log(USDT_decimal)

    const UniswapV2Factory = await hre.midl.getDeployment(`UniswapV2Factory`);
    const UniswapV2FactoryInst = new ethers.Contract(
        UniswapV2Factory.address,
        UniswapV2Factory.abi,
        provider
    );
    const UniswapV2Router = await hre.midl.getDeployment(`UniswapV2Router02`);
    const UniswapV2RouterInst = new ethers.Contract(
        UniswapV2Router.address,
        UniswapV2Router.abi,
        provider
    );

    

    const BTC_USDT_LP_Addr = await UniswapV2FactoryInst.getPair(USDT_Token.address, BTC_Token.address);
    const WBTC_UNISWAP_Addr = await UniswapV2RouterInst.WETH();


    console.log("WBTC_Uniswap address: ", WBTC_UNISWAP_Addr);
    console.log("Uniswap V2 Router Address: ", UniswapV2RouterAddress)
    console.log("USDT Token: ", USDT_Token.address);
    console.log("Helios Pool Address: ",  HeliosPool.address)
    console.log("Helios BTC (hBTC) Address: ",  Helios_BTC_Token_addr)
    console.log("BTC/USD Oralce Address: ",  BTC_USD_Oracle.address)
    console.log("BTC USDT LP token addr: ", BTC_USDT_LP_Addr)


    ///////////////////////////////////////////////////////////
    const TargetContractID = 'ImpermanentLossMitigatorV2'
     await hre.midl.deploy(TargetContractID, {
        args: [
            UniswapV2RouterAddress, // UniswapV2Router
            HeliosPool.address,
            BTC_USDT_LP_Addr,
            BTC_USD_Oracle.address,
            Helios_BTC_Token_addr,
            BTC_Token.address,
            USDT_Token.address
        ],
    });
    await hre.midl.execute();
    const TargetContractIDInst =await hre.midl.getDeployment(TargetContractID);

    ///////////////////////////////////////////////////////////
  

    
    const UniswaplpInst = new ethers.Contract(
        BTC_USDT_LP_Addr,
        [
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "Approval",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount0",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount1",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }
                ],
                "name": "Burn",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount0",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount1",
                        "type": "uint256"
                    }
                ],
                "name": "Mint",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount0In",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount1In",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount0Out",
                        "type": "uint256"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount1Out",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }
                ],
                "name": "Swap",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint112",
                        "name": "reserve0",
                        "type": "uint112"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint112",
                        "name": "reserve1",
                        "type": "uint112"
                    }
                ],
                "name": "Sync",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "Transfer",
                "type": "event"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "DOMAIN_SEPARATOR",
                "outputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "MINIMUM_LIQUIDITY",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "PERMIT_TYPEHASH",
                "outputs": [
                    {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    }
                ],
                "name": "allowance",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }
                ],
                "name": "burn",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "amount0",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount1",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [
                    {
                        "internalType": "uint8",
                        "name": "",
                        "type": "uint8"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "factory",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "getReserves",
                "outputs": [
                    {
                        "internalType": "uint112",
                        "name": "reserve0",
                        "type": "uint112"
                    },
                    {
                        "internalType": "uint112",
                        "name": "reserve1",
                        "type": "uint112"
                    },
                    {
                        "internalType": "uint32",
                        "name": "blockTimestampLast",
                        "type": "uint32"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "initialize",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "kLast",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }
                ],
                "name": "mint",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "liquidity",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "name",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "nonces",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "deadline",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "v",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "r",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "s",
                        "type": "bytes32"
                    }
                ],
                "name": "permit",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "price0CumulativeLast",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "price1CumulativeLast",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    }
                ],
                "name": "skim",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "amount0Out",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "amount1Out",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    }
                ],
                "name": "swap",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "symbol",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "sync",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "token0",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "token1",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "totalSupply",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],
        provider
    );

    const reserves = await UniswaplpInst.getReserves();
    console.log(`Pool reserves: ${reserves[0]}, ${reserves[1]}`);

    const usdtAmt = 110 ;
    const btcAmt = usdtAmt * Number(reserves[0]) / Number(reserves[1]);
    console.log("BTC: ", btcAmt, BigInt(Math.floor(btcAmt * (10 ** parseInt(18)))))
    
    await hre.midl.callContract(`USDT${TESTNET_TOKEN_PREFIX}`, "approve", {
        args: [
            TargetContractIDInst.address,
            BigInt(usdtAmt * 10 ** parseInt(18)),
        ]
    });
    await hre.midl.callContract(TargetContractID, "initializeStrategy", {
        args: [
            BigInt(Math.floor(btcAmt * (10 ** parseInt(18)))).toString(),
            BigInt(Math.floor(usdtAmt * (10 ** parseInt(18)))).toString(),
        ],
        value: BigInt(Math.floor(btcAmt * (10 ** parseInt(18)))),
        
    },
    { 
        deposit: {
          satoshis: weiToSatoshis(BigInt(Math.floor(btcAmt * (10 ** parseInt(18))))),
        }
    });
    await hre.midl.execute();


    await hre.midl.callContract(TargetContractID, "rebalance", {
        args: [
        ]
    });
    await hre.midl.execute();


    return true;
}

module.exports.id = `ImpermanentLoss::helios-v3-core@`;
