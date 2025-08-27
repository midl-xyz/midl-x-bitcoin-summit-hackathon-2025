// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./dependencies/openzeppelin/ReentrancyGuard.sol";
import "./dependencies/openzeppelin/contracts/Ownable.sol";
import "./dependencies/openzeppelin/contracts/IERC20.sol";
import "./dependencies/openzeppelin/contracts/SafeERC20.sol";
import {IBTC} from './interfaces/IBTC.sol';

interface IUniswapV2Router02 {
    function WETH() external pure returns (address);
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
    
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
    
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external view returns (uint[] memory amounts);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IHeliosPool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external;
    function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) external returns (uint256);
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralBTC,
        uint256 totalDebtBTC,
        uint256 availableBorrowsBTC,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    );
}

interface IHToken is IERC20 {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}

interface IChainlinkAggregator {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/**
 * @title Impermanent Loss Mitigator for BTC-USDT LP
 * @dev Strategy that combines Uniswap V2 liquidity provision with Helios V3 borrowing
 *      to dynamically hedge against impermanent loss in BTC-USDT pair
 * 
 * Key Features:
 * - Provides liquidity to BTC-USDT on Uniswap V2
 * - Uses BTC as collateral on Helios V3 to borrow USDT
 * - Dynamically adjusts hedge ratio based on BTC/USD price movements
 * - Maintains safe LTV ratios to prevent liquidation
 * 
 * Oracle: Uses Chainlink BTC/USD price feed (8 decimals)
 * Note: USDT ≈ USD for pricing purposes
 */
contract ImpermanentLossMitigatorV2 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    // Core protocol interfaces
    IUniswapV2Router02 public uniswapRouter;
    IHeliosPool public heliosPool;
    IUniswapV2Pair public btcUsdtPair;
    IChainlinkAggregator public btcPriceOracle;
    
    // Token addresses
    address public WBTC;
    address public USDT;
    
    // Helios tokens
    IHToken public hWBTC;
    
    // Strategy parameters
    uint256 public constant TARGET_LTV = 65e16; // 65%
    uint256 public constant MAX_LTV = 75e16; // 75%
    uint256 public REBALANCE_THRESHOLD = 8e10; // 0.08%
    uint256 public constant HEDGE_ALPHA = 50e16; // 0.5
    uint256 public constant SLIPPAGE_TOLERANCE = 2000; // 20%
    
    // State variables
    uint256 public initialBtcPrice;
    uint256 public lpTokenBalance;
    uint256 public totalBtcDeposited;
    uint256 public totalUsdtBorrowed;
    uint256 public lastRebalancePrice;
    bool public strategyActive;
    
    // Events
    event StrategyInitialized(uint256 btcAmount, uint256 usdtAmount, uint256 lpTokens);
    event Rebalanced(uint256 newBtcPrice, uint256 hedgeAdjustment);
    event EmergencyExit(uint256 btcRecovered, uint256 usdtRecovered);
    event ParameterUpdated(string parameter, uint256 newValue);
    event AddressUpdated(string parameter, address oldAddress, address newAddress);
    
    modifier onlyWhenActive() {
        require(strategyActive, "Strategy not active");
        _;
    }
    
    constructor(
        address _uniswapRouter,
        address _heliosPool,
        address _btcUsdtPair,
        address _btcPriceOracle, // BTC/USD price feed (8 decimals)
        address _hWBTC,
        address _wbtc,
        address _usdt
    ) {
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        heliosPool = IHeliosPool(_heliosPool);
        btcUsdtPair = IUniswapV2Pair(_btcUsdtPair);
        btcPriceOracle = IChainlinkAggregator(_btcPriceOracle); // BTC/USD oracle
        hWBTC = IHToken(_hWBTC);
        
        WBTC = _wbtc;
        USDT = _usdt;
        
        // Initial token approvals
        _setTokenApprovals();
    }
    
    function setTH(uint256 _new) external onlyOwner {
        require(_new < 1e18, "TH must be less than 1e18");
        REBALANCE_THRESHOLD = _new;
    }

    function setStrategyActive(bool _new) external onlyOwner {
        strategyActive = _new;
    }
    /**
     * @dev Set token approvals for Uniswap and Helios
     */
    function _setTokenApprovals() internal {
        // Approve tokens for Uniswap and Helios
        IERC20(WBTC).safeApprove(address(uniswapRouter), type(uint256).max);
        IERC20(USDT).safeApprove(address(uniswapRouter), type(uint256).max);
        IERC20(WBTC).safeApprove(address(heliosPool), type(uint256).max);
        IERC20(USDT).safeApprove(address(heliosPool), type(uint256).max);
    }
    
    /**
     * @dev Initialize the strategy with BTC and USDT
     * @param btcAmount Amount of BTC to deposit
     * @param usdtAmount Amount of USDT to deposit
     */
    function initializeStrategy(uint256 btcAmount, uint256 usdtAmount) external payable onlyOwner {
        require(!strategyActive, "Strategy already active");
        require(btcAmount > 0 && usdtAmount > 0, "Invalid amounts");
        require(btcAmount == msg.value, "BTC amount does not match msg.value");

        // Transfer tokens from user
        IBTC(WBTC).deposit{value: msg.value}();
        IERC20(USDT).safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Get current BTC price
        initialBtcPrice = getCurrentBtcPrice();
        lastRebalancePrice = initialBtcPrice;
        
        // Add liquidity to Uniswap V2
        uint256 liquidityTokens = _addLiquidityToUniswap(btcAmount, usdtAmount);
        lpTokenBalance = liquidityTokens;
        
        // Supply remaining BTC to Helios as collateral
        uint256 remainingBtc = IERC20(WBTC).balanceOf(address(this));
        if (remainingBtc > 0) {
            heliosPool.supply(WBTC, remainingBtc, address(this), 0);
            totalBtcDeposited += remainingBtc;
        }
        
        // Calculate and execute initial borrow
        uint256 borrowAmount = _calculateOptimalBorrow();
        if (borrowAmount > 0) {
            heliosPool.borrow(USDT, borrowAmount, 2, 0, address(this)); // Variable rate
            totalUsdtBorrowed += borrowAmount;
        }
        
        strategyActive = true;
        emit StrategyInitialized(btcAmount, usdtAmount, liquidityTokens);
    }
    
    /**
     * @dev Rebalance the strategy based on current market conditions
     */
    function rebalance() external onlyWhenActive {
        uint256 currentPrice = getCurrentBtcPrice();
        uint256 priceChange = _calculatePriceChange(lastRebalancePrice, currentPrice);
        
        // require(priceChange >= REBALANCE_THRESHOLD, "Rebalance not needed");
        
        // Calculate hedge adjustment
        int256 hedgeAdjustment = _calculateHedgeAdjustment(currentPrice);
        
        if (hedgeAdjustment > 0) {
            // BTC price increased - buy more BTC with borrowed USDT
            _executeHedgeIncrease(uint256(hedgeAdjustment));
        } else if (hedgeAdjustment < 0) {
            // BTC price decreased - sell BTC to reduce exposure
            _executeHedgeDecrease(uint256(-hedgeAdjustment));
        }
        
        // Check and maintain safe LTV ratio
        _maintainSafeLTV();
        
        lastRebalancePrice = currentPrice;
        emit Rebalanced(currentPrice, uint256(hedgeAdjustment));
    }
    
    /**
     * @dev Emergency exit from all positions
     */
    function emergencyExit() external onlyOwner {
        strategyActive = false;
        
        // Repay all debt first
        uint256 debtAmount = _getDebtAmount();
        if (debtAmount > 0) {
            uint256 currentUsdtBalance = IERC20(USDT).balanceOf(address(this));
            
            if (currentUsdtBalance < debtAmount) {
                // Remove liquidity to get USDT for repayment
                _removeLiquidityFromUniswap(lpTokenBalance / 2);
                currentUsdtBalance = IERC20(USDT).balanceOf(address(this));
                
                if (currentUsdtBalance < debtAmount) {
                    // Sell some ETH for USDT if still not enough
                    uint256 ethToSell = _calculateBtcForUsdt(debtAmount - currentUsdtBalance);
                    _swapBtcForUsdt(ethToSell);
                }
            }
            
            heliosPool.repay(USDT, debtAmount, 2, address(this));
        }
        
        // Withdraw all collateral from Aave
        uint256 hTokenBalance = hWBTC.balanceOf(address(this));
        if (hTokenBalance > 0) {
            heliosPool.withdraw(WBTC, type(uint256).max, address(this));
        }
        
        // Remove all liquidity from Uniswap
        if (lpTokenBalance > 0) {
            _removeLiquidityFromUniswap(lpTokenBalance);
        }
        
        // Transfer all recovered tokens to owner
        uint256 finalBtcBalance = IERC20(WBTC).balanceOf(address(this));
        uint256 finalUsdtBalance = IERC20(USDT).balanceOf(address(this));
        
        if (finalBtcBalance > 0) {
            IBTC(WBTC).withdraw(finalBtcBalance);
            _safeTransferBTC(owner(), finalBtcBalance);
        }
        if (finalUsdtBalance > 0) {
            IERC20(USDT).safeTransfer(owner(), finalUsdtBalance);
        }
        
        emit EmergencyExit(finalBtcBalance, finalUsdtBalance);
    }
    
    function _safeTransferBTC(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, 'BTC_TRANSFER_FAILED');
    }

    /**
     * @dev Get current strategy status
     */
    function getStrategyStatus() external view returns (
        uint256 currentBtcPrice,
        uint256 totalValue,
        uint256 healthFactor,
        uint256 currentLTV,
        bool needsRebalance
    ) {
        currentBtcPrice = getCurrentBtcPrice();
        totalValue = _calculateTotalValue();
        
        (, , , , , healthFactor) = heliosPool.getUserAccountData(address(this));
        currentLTV = _getCurrentLTV();
        
        uint256 priceChange = _calculatePriceChange(lastRebalancePrice, currentBtcPrice);
        needsRebalance = priceChange >= REBALANCE_THRESHOLD;
    }
    
    // Internal functions
    
    function _addLiquidityToUniswap(uint256 btcAmount, uint256 usdtAmount) internal returns (uint256 liquidity) {
        (, , liquidity) = uniswapRouter.addLiquidity(
            WBTC,
            USDT,
            btcAmount,
            usdtAmount,
            btcAmount * (10000 - SLIPPAGE_TOLERANCE) / 10000,
            usdtAmount * (10000 - SLIPPAGE_TOLERANCE) / 10000,
            address(this),
            block.timestamp + 300
        );
    }
    
    function _removeLiquidityFromUniswap(uint256 liquidityAmount) internal {
        uniswapRouter.removeLiquidity(
            WBTC,
            USDT,
            liquidityAmount,
            0,
            0,
            address(this),
            block.timestamp + 300
        );
        
        lpTokenBalance -= liquidityAmount;
    }
    
    function _calculateOptimalBorrow() internal view returns (uint256) {
        uint256 collateralValue = totalBtcDeposited * getCurrentBtcPrice() / 1e18;
        return collateralValue * TARGET_LTV / 1e18;
    }
    
    function _calculateHedgeAdjustment(uint256 currentPrice) internal view returns (int256) {
        int256 priceRatio = int256(currentPrice * 1e18 / initialBtcPrice);
        int256 hedgeRatio = int256(HEDGE_ALPHA) * (priceRatio - 1e18) / 1e18;
        
        return hedgeRatio * int256(totalBtcDeposited) / 1e18;
    }
    
    function _executeHedgeIncrease(uint256 amount) internal {
        uint256 availableBorrow = _getAvailableBorrow();
        uint256 borrowAmount = amount > availableBorrow ? availableBorrow : amount;
        
        if (borrowAmount > 0) {
            heliosPool.borrow(USDT, borrowAmount, 2, 0, address(this));
            _swapUsdtForBtc(borrowAmount);
            totalUsdtBorrowed += borrowAmount;
        }
    }
    
    function _executeHedgeDecrease(uint256 amount) internal {
        uint256 btcBalance = IERC20(WBTC).balanceOf(address(this));
        uint256 sellAmount = amount > btcBalance ? btcBalance : amount;
        
        if (sellAmount > 0) {
            uint256 usdtReceived = _swapBtcForUsdt(sellAmount);
            uint256 repayAmount = usdtReceived > totalUsdtBorrowed ? totalUsdtBorrowed : usdtReceived;
            
            heliosPool.repay(USDT, repayAmount, 2, address(this));
            totalUsdtBorrowed -= repayAmount;
        }
    }
    
    function _maintainSafeLTV() internal {
        uint256 currentLTV = _getCurrentLTV();
        
        if (currentLTV > MAX_LTV) {
            uint256 excessDebt = _calculateExcessDebt(); // 인자 제거
            
            // Sell some ETH to repay debt
            uint256 btcToSell = _calculateBtcForUsdt(excessDebt);
            uint256 usdtReceived = _swapBtcForUsdt(btcToSell);
            
            heliosPool.repay(USDT, usdtReceived, 2, address(this));
            totalUsdtBorrowed -= usdtReceived;
        }
    }
    
    function _swapBtcForUsdt(uint256 btcAmount) internal returns (uint256 usdtReceived) {
        address[] memory path = new address[](2);
        path[0] = WBTC;
        path[1] = USDT;
        
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            btcAmount,
            0,
            path,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[1];
    }
    
    function _swapUsdtForBtc(uint256 usdtAmount) internal returns (uint256 btcReceived) {
        address[] memory path = new address[](2);
        path[0] = USDT;
        path[1] = WBTC;
        
        uint[] memory amounts = uniswapRouter.swapExactTokensForTokens(
            usdtAmount,
            0,
            path,
            address(this),
            block.timestamp + 300
        );
        
        return amounts[1];
    }
    
    /**
     * @dev Get current BTC price from Chainlink BTC/USD oracle
     * @return BTC price in USD with 18 decimals
     */
    function getCurrentBtcPrice() public view returns (uint256) {
        (, int256 price, , uint256 updatedAt, ) = btcPriceOracle.latestRoundData();
        
        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt <= 3600, "Stale price data"); // 1 hour staleness check
        
        // Convert from 8 decimals (Chainlink standard) to 18 decimals
        return uint256(price) * 1e10;
    }
    
    function _calculatePriceChange(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        if (newPrice > oldPrice) {
            return (newPrice - oldPrice) * 1e18 / oldPrice;
        } else {
            return (oldPrice - newPrice) * 1e18 / oldPrice;
        }
    }
    
    function _getCurrentLTV() internal view returns (uint256) {
        (uint256 totalCollateralBTC, uint256 totalDebtBTC, , , , ) = heliosPool.getUserAccountData(address(this));
        
        if (totalCollateralBTC == 0) return 0;
        return totalDebtBTC * 1e18 / totalCollateralBTC;
    }
    
    function _getAvailableBorrow() internal view returns (uint256) {
        (, , uint256 availableBorrowsBTC, , , ) = heliosPool.getUserAccountData(address(this));
        uint256 btcPrice = getCurrentBtcPrice();
        return availableBorrowsBTC * 1e18 / btcPrice;
    }
    
    function _getDebtAmount() internal view returns (uint256) {
        (, uint256 totalDebtBTC, , , , ) = heliosPool.getUserAccountData(address(this));
        uint256 btcPrice = getCurrentBtcPrice();
        return totalDebtBTC * 1e18 / btcPrice;
    }
    
    function _calculateExcessDebt() internal view returns (uint256) {
        (uint256 totalCollateralBTC, uint256 totalDebtBTC, , , , ) = heliosPool.getUserAccountData(address(this));
        uint256 targetDebtBTC = totalCollateralBTC * TARGET_LTV / 1e18;
        
        if (totalDebtBTC > targetDebtBTC) {
            uint256 btcPrice = getCurrentBtcPrice();
            return (totalDebtBTC - targetDebtBTC) * 1e18 / btcPrice;
        }
        
        return 0;
    }
    
    function _calculateBtcForUsdt(uint256 usdtAmount) internal view returns (uint256) {
        uint256 btcPrice = getCurrentBtcPrice();
        return usdtAmount * 1e18 / btcPrice;
    }
    
    function _calculateTotalValue() internal view returns (uint256) {
        uint256 lpValue = _calculateLPValue();
        uint256 collateralValue = hWBTC.balanceOf(address(this)) * getCurrentBtcPrice() / 1e18;
        uint256 freeBtcValue = IERC20(WBTC).balanceOf(address(this)) * getCurrentBtcPrice() / 1e18;
        uint256 freeUsdtValue = IERC20(USDT).balanceOf(address(this));
        uint256 debtValue = totalUsdtBorrowed;
        
        return lpValue + collateralValue + freeBtcValue + freeUsdtValue - debtValue;
    }
    
    function _calculateLPValue() internal view returns (uint256) {
        if (lpTokenBalance == 0) return 0;
        
        (uint112 reserve0, uint112 reserve1, ) = btcUsdtPair.getReserves();
        address token0 = btcUsdtPair.token0();
        
        uint256 totalSupply = IERC20(address(btcUsdtPair)).totalSupply();
        uint256 lpShare = lpTokenBalance * 1e18 / totalSupply;
        
        uint256 btc_reserve = token0 == WBTC ? uint256(reserve0) : uint256(reserve1);
        uint256 usdt_reserve = token0 == WBTC ? uint256(reserve1) : uint256(reserve0);
        
        uint256 btcValue = btc_reserve * lpShare / 1e18 * getCurrentBtcPrice() / 1e18;
        uint256 usdtValue = usdt_reserve * lpShare / 1e18;
        
        return btcValue + usdtValue;
    }
    
    // Admin functions
    
    function updateParameter(string calldata parameter, uint256 newValue) external onlyOwner {
        // This would include functions to update strategy parameters
        // Implementation depends on specific requirements
        emit ParameterUpdated(parameter, newValue);
    }
    
    /**
     * @dev Update Uniswap Router address
     * @param _newRouter New router address
     */
    function updateUniswapRouter(address _newRouter, address _newWBTC) external onlyOwner {
        require(_newRouter != address(0), "Invalid router address");
        require(!strategyActive, "Cannot update while strategy is active");
        
        address oldRouter = address(uniswapRouter);
        
        // Revoke old approvals
        IERC20(WBTC).safeApprove(oldRouter, 0);
        IERC20(USDT).safeApprove(oldRouter, 0);
        
        uniswapRouter = IUniswapV2Router02(_newRouter);
        
        // Update WBTC address from new router
        WBTC = _newWBTC;
        
        // Set new approvals
        _setTokenApprovals();
        
        emit AddressUpdated("UniswapRouter", oldRouter, _newRouter);
        emit AddressUpdated("WBTC", WBTC, WBTC);
    }
    
    /**
     * @dev Update Helios Pool address
     * @param _newPool New pool address
     */
    function updateHeliosPool(address _newPool) external onlyOwner {
        require(_newPool != address(0), "Invalid pool address");
        require(!strategyActive, "Cannot update while strategy is active");
        
        address oldPool = address(heliosPool);
        
        // Revoke old approvals
        IERC20(WBTC).safeApprove(oldPool, 0);
        IERC20(USDT).safeApprove(oldPool, 0);
        
        heliosPool = IHeliosPool(_newPool);
        
        // Set new approvals
        _setTokenApprovals();
        
        emit AddressUpdated("HeliosPool", oldPool, _newPool);
    }
    
    /**
     * @dev Update BTC-USDT pair address
     * @param _newPair New pair address
     */
    function updateBtcUsdtPair(address _newPair) external onlyOwner {
        require(_newPair != address(0), "Invalid pair address");
        require(!strategyActive, "Cannot update while strategy is active");
        
        address oldPair = address(btcUsdtPair);
        btcUsdtPair = IUniswapV2Pair(_newPair);
        
        emit AddressUpdated("BtcUsdtPair", oldPair, _newPair);
    }
    
    /**
     * @dev Update BTC price oracle address
     * @param _newOracle New oracle address
     */
    function updateBtcPriceOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        require(!strategyActive, "Cannot update while strategy is active");
        
        address oldOracle = address(btcPriceOracle);
        btcPriceOracle = IChainlinkAggregator(_newOracle);
        
        emit AddressUpdated("BtcPriceOracle", oldOracle, _newOracle);
    }
    
    /**
     * @dev Update hWBTC token address
     * @param _newAWBTC New hWBTC address
     */
    function updateAWBTC(address _newAWBTC) external onlyOwner {
        require(_newAWBTC != address(0), "Invalid hWBTC address");
        require(!strategyActive, "Cannot update while strategy is active");
        
        address oldAWBTC = address(hWBTC);
        hWBTC = IHToken(_newAWBTC);
        
        emit AddressUpdated("hWBTC", oldAWBTC, _newAWBTC);
    }
    
    /**
     * @dev Update USDT token address
     * @param _newUSDT New USDT address
     */
    function updateUSDT(address _newUSDT) external onlyOwner {
        require(_newUSDT != address(0), "Invalid USDT address");
        require(!strategyActive, "Cannot update while strategy is active");
        
        address oldUSDT = USDT;
        
        // Revoke old approvals
        IERC20(oldUSDT).safeApprove(address(uniswapRouter), 0);
        IERC20(oldUSDT).safeApprove(address(heliosPool), 0);
        
        USDT = _newUSDT;
        
        // Set new approvals
        _setTokenApprovals();
        
        emit AddressUpdated("USDT", oldUSDT, _newUSDT);
    }
    
    /**
     * @dev Get all current addresses for verification
     */
    function getAddresses() external view returns (
        address _uniswapRouter,
        address _heliosPool,
        address _btcUsdtPair,
        address _btcPriceOracle,
        address _hWBTC,
        address _wbtc,
        address _usdt
    ) {
        return (
            address(uniswapRouter),
            address(heliosPool),
            address(btcUsdtPair),
            address(btcPriceOracle),
            address(hWBTC),
            WBTC,
            USDT
        );
    }
    
    receive() external payable {
        // Convert BTC to WBTC if needed
        revert("Use WBTC instead of BTC");
    }
}