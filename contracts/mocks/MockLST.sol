// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockLST
 * @dev Mock liquid staking token for testing purposes
 */
contract MockLST is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    /**
     * @dev Mint tokens to an address (for testing)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Override decimals to support different decimal places
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}

/**
 * @title MockStETH
 * @dev Mock Lido stETH token
 */
contract MockStETH is MockLST {
    constructor() MockLST("Liquid staked Ether 2.0", "stETH", 18) {}
}

/**
 * @title MockRETH
 * @dev Mock Rocket Pool rETH token
 */
contract MockRETH is MockLST {
    constructor() MockLST("Rocket Pool ETH", "rETH", 18) {}
}

/**
 * @title MockSAVAX
 * @dev Mock Benqi sAVAX token
 */
contract MockSAVAX is MockLST {
    constructor() MockLST("Staked AVAX", "sAVAX", 18) {}
} 